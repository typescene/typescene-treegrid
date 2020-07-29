import {
  JSX,
  ComponentConstructor,
  managed,
  managedChild,
  ManagedList,
  ManagedMap,
  ManagedObject,
  observe,
  onPropertyChange,
  rateLimit,
  UICell,
  UIComponentEventHandler,
  UIRenderable,
  UIStyle,
  ViewComponent,
} from "typescene";
import { TreeGridRow } from "./TreeGridRow";

/** Default style for tree grid columns */
const _columnStyle = UIStyle.create("TreeGridColumnBase", {
  dimensions: { shrink: 1 },
});
const ColumnBase = UICell.with({ style: _columnStyle });

/** Default style for container cells */
const _treeGridContainerStyle = UIStyle.create("TreeGridContainer", {
  dimensions: { grow: 0 },
  containerLayout: { axis: "horizontal", distribution: "start" },
});

/** Encapsulates a fixed reference to a row, as well as pointers to its parent item and next sibling in the list */
class TreeGridRowPointer<RowT extends TreeGridRow> extends ManagedObject {
  @managed
  row?: RowT;
  parent?: TreeGridRowPointer<RowT>;
  next?: TreeGridRowPointer<RowT>;
}

/**
 * Represents a hierarchical view with rows and columns.
 * **Note:** This component is rendered as a set of columns, but is managed as a set of rows (in `.rows`) which must be of type `TreeGridRow`. The row type is NOT a UI component.
 */
export class TreeGridView<RowT extends TreeGridRow = TreeGridRow> extends ViewComponent {
  static preset(presets: TreeGridView.Presets): Function {
    // check for preset properties
    let columnCount = presets.columnCount;
    let rowHeight = presets.rowHeight;
    let rowSeparator = presets.rowSeparator;
    let rowConstructors = presets.rows || [];
    delete presets.rows;
    let columnConstructors = presets.columns || [];
    delete presets.columns;
    this.presetBindingsFrom(...rowConstructors, ...columnConstructors);

    // separate event handlers from other presets
    let cellPresets: any = {};
    let handlers: any = {};
    for (let k in presets) {
      (k[0] === "o" && k[1] === "n" && (k.charCodeAt(2) < 97 || k.charCodeAt(2) > 122)
        ? handlers
        : cellPresets)[k] = (presets as any)[k];
    }

    // apply presets to UICell instead, except for event handlers and `columns`
    let f = super.preset(
      handlers,
      UICell.with({ style: _treeGridContainerStyle }).with(cellPresets)
    );
    return function (this: TreeGridView) {
      if (columnCount !== undefined) this.columnCount = columnCount;
      if (rowHeight !== undefined) this.rowHeight = rowHeight;
      if (rowSeparator !== undefined) this.rowSeparator = rowSeparator;
      this._columnConstructors = columnConstructors;
      this.rows.replace(rowConstructors.map((C: any) => new C()));
      return f.call(this);
    };
  }

  /** All rows at the highest level of the tree */
  @managedChild
  readonly rows = new ManagedList<RowT>();

  /** Number of visible columns (defaults to 1) */
  columnCount: number = 1;

  /** Fixed row height, *must* be defined in absolute units (defaults to 32) */
  rowHeight: number | string = 32;

  /** Row separator options (plain object) */
  rowSeparator?: UIStyle.SeparatorOptions;

  /** Returns an array of currently visible rows (those not hidden as a child of a collapsed parent) */
  getVisibleRows(): RowT[] {
    return this._visibleRows.map(ptr => ptr.row!).filter(r => !!r);
  }

  /** Set the width of given column (zero based index) */
  setColumnWidth(index: number, width?: string | number | UIStyle.Dimensions) {
    if (typeof width === "number" || typeof width === "string") {
      // set specific width
      this._columnDimensions[index] = {
        width,
        maxWidth: width,
        grow: 0,
      };
    } else if (width) {
      // copy dimensions but exclude height
      this._columnDimensions[index] = {
        ...width,
        height: undefined,
        maxHeight: undefined,
        minHeight: undefined,
      };
    } else {
      // remove dimensions altogether
      delete this._columnDimensions[index];
    }

    // apply to actual column cell if already rendered
    if (this.view) {
      let view = this.view as UICell;
      if (view.content.count > index) {
        let column = view.content.get(index);
        if (column instanceof UICell) {
          column.dimensions = this._columnDimensions[index];
        }
      }
    }
  }

  /** @internal Update the visible part of the tree, or given branch; this method is called automatically as (nested) `rows` list properties change, it should not be necessary to call this method directly */
  updateVisibleRows(row?: RowT, rebuildColumns?: boolean) {
    if (!this._visibleRows) return;
    if (!this.rows) this._visibleRows.clear();
    if (!row) {
      // replace all pointers and content
      let pointers = this._makeRowPointers(undefined, this.rows);
      this._visibleRows.replace(pointers);
    } else {
      // replace only the children in this branch
      let ptr = this._rowPointers.get(String(row.managedId));
      let pointers = row.collapsed ? [] : this._makeRowPointers(ptr, row.rows);
      if (ptr) {
        let next = this._findNextVisible(ptr);
        let clonedList = new ManagedList().replace(this._visibleRows);
        clonedList.splice(ptr, next, ptr, ...pointers);
        this._visibleRows.replace(clonedList);
      }
    }

    // rebuild main cell content
    if (
      rebuildColumns ||
      !this.view ||
      (this.view as UICell).content.count !== this.columnCount
    ) {
      this._rebuildColumns();
    }
    let pointer = row && this._rowPointers.get(String(row.managedId));
    if (pointer) this._rebuildRows(pointer);
    else this._rebuildAllCells();
  }

  /** Create a single list of row pointers for given list of rows */
  private _makeRowPointers(
    parent: TreeGridRowPointer<RowT> | undefined,
    list: ManagedList<RowT>,
    result: TreeGridRowPointer<RowT>[] = []
  ) {
    let prev: TreeGridRowPointer<RowT> | undefined;
    list.forEach(row => {
      let ptr = new TreeGridRowPointer<RowT>();
      ptr.row = row;
      ptr.parent = parent;
      if (prev) prev.next = ptr;
      result.push(ptr);
      this._rowPointers.set(String(row.managedId), ptr);
      prev = ptr;
      if (!row.collapsed) this._makeRowPointers(ptr, row.rows, result);
    });
    return result;
  }

  /** Replace all main content with new columns */
  private _rebuildColumns() {
    let view = this.view as UICell;
    if (!view) return;
    let columns: UICell[] = [];
    for (let i = +this.columnCount - 1; i >= 0; i--) {
      let col: UICell =
        (this._columnConstructors &&
          ((this._columnConstructors[i] && new (this._columnConstructors[i] as any)()) ||
            (this._columnConstructors.length &&
              new (this._columnConstructors[
                this._columnConstructors.length - 1
              ] as any)()))) ||
        new ColumnBase();
      col.layout = {
        distribution: "fill",
        gravity: "start",
        clip: true,
        separator: this.rowSeparator,
      };
      if (this._columnDimensions[i]) col.dimensions = this._columnDimensions[i];
      columns.unshift(col);
    }
    view.content.replace(columns);
  }

  /** Perform full update for all column content */
  private _rebuildAllCells() {
    let view = this.view as UICell;
    if (!view) return;
    let cellsByColumn: UICell[][] = [];
    let count = this._visibleRows.count;
    for (let i = this.columnCount; i > 0; i--) {
      cellsByColumn.push(new Array(count));
    }
    let i = 0;
    this._visibleRows.forEach(ptr => {
      if (!ptr.row) return;
      for (let j = 0; j < this.columnCount; j++) {
        let cell = ptr.row.cellAt(j);
        cell.dimensions = {
          grow: 0,
          shrink: 0,
          height: this.rowHeight,
          maxHeight: this.rowHeight,
          minHeight: this.rowHeight,
        };
        cellsByColumn[j][i] = cell;
      }
      i++;
    });
    i = 0;
    view.content.forEach(col => {
      if (col instanceof UICell) {
        col.content.replace(cellsByColumn[i]);
      }
      i++;
    });
  }

  /** Perform a partial update of the tree view, for all _children_ of given branch (not the row itself) */
  private _rebuildRows(pointer: TreeGridRowPointer<RowT>) {
    let view = this.view as UICell;
    if (!view) return;
    let start = this._visibleRows.indexOf(pointer);
    if (start < 0) return;
    let next = this._findNextVisible(pointer);
    let stop = next && this._visibleRows.indexOf(next);
    if (!stop || stop < 0) stop = this._visibleRows.count;
    let [, ...rows] = this._visibleRows.take(stop - start, pointer).filter(r => !!r.row);
    let i = 0;
    view.content.forEach(col => {
      if (col instanceof UICell) {
        let cells = rows.map(r => r.row!.cellAt(i));
        cells.forEach(cell => {
          cell.dimensions = {
            grow: 0,
            shrink: 0,
            height: this.rowHeight,
            maxHeight: this.rowHeight,
            minHeight: this.rowHeight,
          };
        });

        // splice content on a clone of the actual column content,
        // to avoid child components to be destroyed in the process
        let colClone = new ManagedList<UIRenderable>().replace(col.content);
        let ownCell = pointer.row!.cellAt(i);
        let oldNextCell = (next && next.row && next.row.cellAt(i)) || undefined;
        colClone.splice(ownCell, oldNextCell, ownCell, ...cells);
        col.content.replace(colClone);
      }
      i++;
    });
  }

  /** Returns the next visible row at the same level or higher */
  private _findNextVisible(pointer: TreeGridRowPointer<RowT>) {
    let cur = pointer;
    let next = pointer.next;
    while (!next && cur.parent) {
      next = (cur = cur.parent).next;
    }
    return next;
  }

  /** Flat list of all visible rows as instances of `TreeGridRowPointer`, not rows themselves to preserve integrity when rows are destroyed */
  @managedChild
  private _visibleRows = new ManagedList<TreeGridRowPointer<RowT>>();

  /** Index of row pointers by row ID; pointers here are automatically removed when they are removed from the flat list of visible rows */
  private _rowPointers = new ManagedMap<TreeGridRowPointer<RowT>>();

  /** Column dimensions as set by `setColumnWidth` */
  private _columnDimensions: UIStyle.Dimensions[] = [];

  /** Column constructors as set by the static preset method */
  private _columnConstructors?: ComponentConstructor<UICell>[];

  /** @internal Observer for all tree grid instances */
  @observe
  static TreeGridObserver: unknown = (() => {
    class TreeGridObserver {
      constructor(public treeGrid: TreeGridView) {}
      @onPropertyChange("rowHeight", "rowSeparator", "columnCount")
      updateRowsAndColumns() {
        if (this.treeGrid.view) {
          this.treeGrid.updateVisibleRows(undefined, true);
        }
      }
      @rateLimit(20)
      onRowsChangeAsync() {
        if (this.treeGrid.view) {
          this.treeGrid.updateVisibleRows(undefined);
        }
      }
      onActive() {
        if (!this._initialized) {
          this._initialized = true;
          this.treeGrid.propagateComponentEvent("Initialize");
          this.treeGrid.updateVisibleRows();
        }
      }
      private _initialized = false;
    }
    return TreeGridObserver;
  })();
}

export namespace TreeGridView {
  /** TreeGrid presets type, for use with `Component.with` */
  export interface Presets extends UICell.Presets {
    /** Set of rows to be displayed (array of `TreeGridRow` instances or binding to a managed list) */
    rows?: ComponentConstructor<TreeGridRow>[];

    /** Number of visible columns (defaults to 1) */
    columnCount?: number;

    /** Column constructors; the last constructor is used for all remaining columns if `columnCount` is set to a higher number than the length of the array */
    columns?: ComponentConstructor<UICell>[];

    /** Fixed row height, *must* be defined in absolute units (defaults to 32) */
    rowHeight?: number | string;

    /** Row separator options (plain object) */
    rowSeparator?: UIStyle.SeparatorOptions;

    /** Event handler that is called when the tree grid data has been initialized */
    onInitialize?: UIComponentEventHandler;
  }
}

/** Represents a hierarchical view with rows and columns. This component has NO content, use the `rows` property instead. */
export const TreeGrid = JSX.tag(TreeGridView);
