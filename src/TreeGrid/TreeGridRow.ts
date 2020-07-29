import {
  ComponentConstructor,
  managed,
  managedChild,
  ManagedEvent,
  ManagedList,
  ManagedRecord,
  observe,
  onPropertyEvent,
  UIBeforeRenderEvent,
  UICell,
  UIComponentEventHandler,
  UIStyle,
} from "typescene";
import { TreeGridView } from "./TreeGrid";

/** Tree grid cell component, created by the containing row and rendered by the parent tree grid. Each instance has a reference to its containing row. */
export class TreeGridRowCell extends UICell.with({
  style: UIStyle.create("TreeGridRowCell", {
    containerLayout: { axis: "horizontal", distribution: "start" },
  }),
  asyncContentRendering: true,
}) {
  constructor(row: TreeGridRow, columnIndex: number) {
    super();
    this.row = row;
    this.columnIndex = columnIndex;
  }

  /** The row that contains this cell */
  @managed
  row: TreeGridRow;

  /** The current column index of this cell */
  columnIndex: number;
}

/**
 * Represents a single row in a tree grid (see `TreeGrid`), as well as any rows in the hierarchy below it. The `populateCell` method can be overridden to populate new cells just before they are rendered. Instances of this class also propagate all events that are emitted by its cells (e.g. user interactions, Select/Deselect events).
 * @note As cells become part of the parent tree grid's UI components, they are _not_ child components of the `TreeGridRow` instance. As a result, bindings may not work as expected and the `populateCell` method should be used to add UI components dynamically.
 */
export class TreeGridRow extends ManagedRecord {
  static preset(
    presets: TreeGridRow.Presets,
    ...rows: ComponentConstructor<TreeGridRow>[]
  ): Function {
    let rowConstructors = Array.isArray(presets.rows) ? presets.rows : rows;
    delete presets.rows;
    this.presetBindingsFrom(...rowConstructors);
    let f = super.preset(presets);
    return function (this: TreeGridRow) {
      f.call(this);
      if (rowConstructors) this.rows.replace(rowConstructors.map((C: any) => new C()));
    };
  }

  /** Create a new row */
  constructor(collapsed?: boolean) {
    super();
    if (collapsed) this.collapsed = true;
  }

  /** Returns the cell at given index; if the cell does not exist yet, it is created along with all cells before it. It is possible to create more cells than will be displayed in the parent tree grid. */
  cellAt(index: number) {
    if (!this.allCells) {
      let list = (this.allCells = new ManagedList().restrict(TreeGridRowCell));
      list.propagateEvents();
    }
    while (index >= this.allCells.count) {
      this.allCells.add(new TreeGridRowCell(this, index));
    }
    return this.allCells.get(index);
  }

  /** The current number of cells that have been created for this row. This number may be smaller or larger than the number of columns in the tree grid. */
  get cellCount() {
    return this.allCells ? this.allCells.count : 0;
  }

  /** Method that can be overridden to handle population of new cells just before they are rendered */
  populateCell(_cell: TreeGridRowCell) {}

  /** All rows one level below the current row */
  @managedChild
  readonly rows = new ManagedList<this>();

  /** True if rows at the next level below this row should be hidden from view (observed by the tree grid component) */
  collapsed = false;

  /** All cells contained by this row; these are not removed so there may be more than the number of columns displayed by the tree grid */
  @managed
  private allCells?: ManagedList<TreeGridRowCell>;

  @observe
  static TreeGridRowObserver: unknown = (() => {
    class TreeGridRowObserver {
      constructor(public row: TreeGridRow) {}

      // update a branch of the tree when the child rows list changes
      onRowsChange() {
        let treeGrid = this.row.getParentComponent(TreeGridView);
        if (treeGrid) treeGrid.updateVisibleRows(this.row);
      }

      // update the branch when it is collapsed/expanded
      onCollapsedChange() {
        if (!this.row.cellCount) return;
        let treeGrid = this.row.getParentComponent(TreeGridView);
        if (treeGrid) treeGrid.updateVisibleRows(this.row);
      }

      @onPropertyEvent("allCells")
      handleCellEvents(_list: any, e: ManagedEvent) {
        if (e instanceof UIBeforeRenderEvent && e.source instanceof TreeGridRowCell) {
          this.row.populateCell(e.source);
        }
        this.row.emit(e);
      }
    }
    return TreeGridRowObserver;
  })();
}

export namespace TreeGridRow {
  /** TreeGrid presets type, for use with `Component.with` */
  export interface Presets {
    /** Set of rows to be displayed one level below this row (array of `TreeGridRow` instances or binding to a managed list) */
    rows?: ComponentConstructor<TreeGridRow>[];
    /** True if rows at the next level below this row should be hidden from view */
    collapsed?: boolean;
    /** Event handler that is called when the row is selected */
    onSelect?: UIComponentEventHandler<TreeGridRow>;
    /** Event handler that is called when the row is deselected */
    onDeselect?: UIComponentEventHandler<TreeGridRow>;
    /** Event handler that is called when the row is clicked */
    onClick?: UIComponentEventHandler<TreeGridRow>;
    /** Event handler that is called when the row is double-clicked */
    onDoubleClick?: UIComponentEventHandler<TreeGridRow>;
    /** Event handler that is called when the Enter key is pressed while the row has input focus */
    onEnterKeyPress?: UIComponentEventHandler<TreeGridRow>;
  }
}
