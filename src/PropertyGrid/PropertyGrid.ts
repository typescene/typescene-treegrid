import { JSX, ComponentEvent, managed, observe, bind, UIFormContext } from "typescene";
import { TreeGridRowCell, TreeGridView } from "../TreeGrid";
import { PropertyGridRow } from "./PropertyGridRow";

/** Represents a two-column property grid with (nested) rows of property labels and inputs. */
export class PropertyGridView extends TreeGridView<PropertyGridRow> {
  static preset(presets: PropertyGridView.Presets): Function {
    let horizontalCellPadding = presets.horizontalCellPadding;
    delete presets.horizontalCellPadding;
    let iconExpanded = presets.iconExpanded;
    delete presets.iconExpanded;
    let iconCollapsed = presets.iconCollapsed;
    delete presets.iconCollapsed;
    let iconSize = presets.iconSize;
    delete presets.iconSize;
    let iconMargin = presets.iconMargin;
    delete presets.iconMargin;
    let f = super.preset(presets);
    return function (this: PropertyGridView) {
      if (horizontalCellPadding !== undefined)
        this.horizontalCellPadding = horizontalCellPadding;
      if (iconExpanded !== undefined) this.iconExpanded = iconExpanded;
      if (iconCollapsed !== undefined) this.iconCollapsed = iconCollapsed;
      if (iconSize !== undefined) this.iconSize = iconSize;
      if (iconMargin !== undefined) this.iconMargin = iconMargin;
      return f.call(this);
    };
  }

  constructor() {
    super();

    // set initial column width for the preview column
    this.columnCount = 2;
    this.setColumnWidth(1, "50%");
  }

  /** Horizontal padding for both label and preview rows, defaults to 8 */
  horizontalCellPadding = 8;

  /** Icon to be displayed in front of expanded group row labels */
  iconExpanded = "-";

  /** Icon to be displayed in front of collapsed group row labels */
  iconCollapsed = "+";

  /** Collapsed/expanded icon size (dp) */
  iconSize = 16;

  /** Collapsed/expanded icon margin (dp) */
  iconMargin = 0;

  /** Currently selected row, if any */
  selectedRow?: PropertyGridRow;

  /** Current bound parent form context, if any (bound to `formContext`) */
  @managed
  formContext?: UIFormContext;

  @observe
  static PropertyGridObserver = class {
    constructor(public grid: PropertyGridView) {}
    onFormContextChange() {
      this.grid.getVisibleRows().forEach(r => {
        if (r.updateOnFormContextChange) {
          r.populateCell(r.cellAt(1));
        }
      });
    }
    onSelect(e: ComponentEvent) {
      if (e.source instanceof TreeGridRowCell && e.source.row !== this.grid.selectedRow) {
        let old = this.grid.selectedRow;
        this.grid.selectedRow = e.source.row as any;
        if (old && old.managedState) old.emitAction("Deselect");
      }
    }
    onDeselect(e: ComponentEvent) {
      if (e.source instanceof TreeGridRowCell && e.source.row === this.grid.selectedRow) {
        this.grid.selectedRow = undefined;
      }
    }
  };
}

// add binding for `formContext` property
PropertyGridView.presetBinding("formContext", bind("formContext"));

export namespace PropertyGridView {
  export interface Presets extends TreeGridView.Presets {
    /** Horizontal padding for both label and preview rows, defaults to 8 */
    horizontalCellPadding?: number;
    /** Icon to be displayed in front of expanded group row labels */
    iconExpanded?: string;
    /** Icon to be displayed in front of collapsed group row labels */
    iconCollapsed?: string;
    /** Collapsed/expanded icon size (dp) */
    iconSize?: number;
    /** Collapsed/expanded icon margin (dp) */
    iconMargin?: number;
  }
}

/** Represents a two-column property grid with (nested) rows of property labels and inputs. This component has NO content; use the `rows` property instead */
export const PropertyGrid = JSX.tag(PropertyGridView);
