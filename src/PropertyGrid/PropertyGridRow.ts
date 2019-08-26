import {
  ComponentConstructor,
  ManagedEvent,
  observe,
  UIButton,
  UICell,
  UIComponent,
  UIComponentEvent,
  UIComponentEventHandler,
  UILabel,
  UIRenderable,
  UISpacer,
  UIStyle,
  UITextField,
} from "typescene";
import { TreeGridRow, TreeGridRowCell } from "../TreeGrid";
import { PropertyGridView } from "./PropertyGrid";

/** Helper function that converts any value into a single line of text */
function singleLineOfText(s = "") {
  return String(s).replace(/\r\n|\n\r|\r|\n/g, " ");
}

/** Style for property grid labels */
const _propertyGridLabelStyle = UIStyle.create("PropertyGridLabel", {
  position: { gravity: "center" },
  textStyle: { lineBreakMode: "ellipsis" },
});

/** Action button constructor */
const PropertyGridActionButton = UIButton.with({
  onClick: "+PropertyGridActionButtonClick",
  style: UIStyle.create("PropertyGridAction", {
    controlStyle: { background: "transparent", borderRadius: 0 },
    dimensions: { minWidth: 0, height: 32 },
  }),
});

/** Represents a single row within a property grid */
export class PropertyGridRow extends TreeGridRow {
  static preset(
    presets: PropertyGridRow.Presets,
    ...rows: ComponentConstructor<PropertyGridRow>[]
  ) {
    return super.preset(presets, ...rows);
  }

  /** Name label text for this row */
  label?: string;

  /** Text style used for the name label */
  labelTextStyle?: UIStyle.TextStyle;

  /** Preview cell icon (in front of preview text) */
  previewIcon?: string;

  /** Preview cell icon size */
  previewIconSize?: string | number;

  /** Preview cell icon margin */
  previewIconMargin?: string | number;

  /** Preview cell icon color */
  previewIconColor?: string;

  /** Preview cell text */
  previewText?: string;

  /** Text style used for the preview cell text */
  previewTextStyle?: UIStyle.TextStyle;

  /** Action button text label */
  previewActionText?: string;

  /** Action button icon label */
  previewActionIcon?: string;

  /** Action button icon size */
  previewActionIconSize?: string | number;

  /** Action button icon margin */
  previewActionIconMargin?: string | number;

  /** Action button icon color */
  previewActionIconColor?: string;

  /** Action button style */
  previewActionButtonStyle?: UIStyle;

  /** Grouping level, set automatically when populating this row */
  groupLevel = 0;

  /** Set to true if this row should show an icon when it is _not_ in a collapsed state; automatically enabled for group rows */
  showExpandedIcon?: boolean;

  /** Set to true if this row should be updated when the surrounding form emits a change event on its `formContext` property; automatically enabled for rows with an input field and a value for the `name` property */
  updateOnFormContextChange?: boolean;

  /** Refresh all cells in this row (only) */
  refresh() {
    let numCells = this.cellCount;
    for (let i = 0; i < numCells; i++) {
      let cell = this.cellAt(i);
      this.populateCell(cell);
    }
  }

  /** Returns true if this row is currently selected */
  isSelected() {
    return this._selected;
  }

  /** Use given UI component for the preview cell, instead of a plain label */
  setPreviewComponent(component: UIRenderable) {
    this._previewComponent = component;
  }
  private _previewComponent?: UIRenderable;

  populateCell(cell: TreeGridRowCell) {
    if (cell.columnIndex === 0) this._populateLabelCell(cell);
    else this._populatePreviewCell(cell);
  }

  /** Populate the first cell in this row only */
  private _populateLabelCell(cell: TreeGridRowCell) {
    // create a variable spacer in front
    let grid = this.getParentComponent(PropertyGridView);
    let padding = grid ? grid.horizontalCellPadding : 0;
    let group = this.getParentComponent(PropertyGridRow);
    this.groupLevel = group ? group.groupLevel + 1 : 0;
    let iconSize = grid ? grid.iconSize : 16;
    let iconMargin = grid ? grid.iconMargin : 0;
    let spacer = new UISpacer(0);
    spacer.dimensions = {
      grow: 0,
      shrink: 0,
      width: (iconSize + iconMargin) * this.groupLevel + padding,
    };

    // create the label itself
    let label = new UILabel(singleLineOfText(this.label));
    label.style.mixin(_propertyGridLabelStyle);
    if (this.labelTextStyle) label.textStyle = this.labelTextStyle;
    label.icon = grid
      ? this.collapsed
        ? grid.iconCollapsed
        : this.showExpandedIcon
        ? grid.iconExpanded
        : ""
      : "";
    label.iconSize = iconSize;
    label.iconMargin = iconMargin;

    // replace all content
    cell.content.replace([spacer, label]);
    cell.background = this._selected ? "@primary" : "";
    cell.textColor = this._selected ? "@primary:text" : "";
    cell.allowKeyboardFocus = true;
  }

  /** Populate the second cell in this row only */
  private _populatePreviewCell(cell: TreeGridRowCell) {
    cell.content.clear();

    // add a spacer for some padding in the middle
    let grid = this.getParentComponent(PropertyGridView);
    let padding = grid ? grid.horizontalCellPadding : 0;
    let spacer = new UISpacer(padding);
    cell.content.add(spacer);

    // add component, or preview label and/or icon
    if (this._previewComponent) {
      cell.content.add(this._previewComponent, new UISpacer(padding));
    } else if (this.previewText || this.previewIcon || !this.showExpandedIcon) {
      let label = new UILabel(singleLineOfText(this.previewText));
      label.shrinkwrap = false;
      label.style = label.style.mixin(_propertyGridLabelStyle);
      if (this.previewTextStyle) label.textStyle = this.previewTextStyle;
      if (this.previewIcon) {
        label.icon = this.previewIcon;
        if (this.previewIconSize) label.iconSize = this.previewIconSize;
        if (this.previewIconMargin) label.iconMargin = this.previewIconMargin;
        if (this.previewIconColor) label.iconColor = this.previewIconColor;
      }
      cell.content.add(label);
    }

    // add action button
    if (this.previewActionText || this.previewActionIcon) {
      let button = new PropertyGridActionButton(this.previewActionText);
      if (this.previewActionButtonStyle) button.style.mixin(this.previewActionButtonStyle);
      if (this.previewActionIcon) button.icon = this.previewActionIcon;
      if (this.previewActionIconColor) button.iconColor = this.previewActionIconColor;
      if (this.previewActionIconSize) button.iconSize = this.previewActionIconSize;
      if (this.previewActionIconMargin) button.iconMargin = this.previewActionIconMargin;
      cell.content.add(button);
    }

    // add separator on the left and right
    if (
      this.previewText !== undefined ||
      this.previewIcon ||
      this._previewComponent ||
      this.previewActionText ||
      this.previewActionIcon
    ) {
      cell.borderColor = "@separator";
      cell.borderThickness = { x: 1 };
    } else {
      cell.borderThickness = 0;
    }
    cell.background = this._selected ? "@primary/20%" : "";
    cell.allowKeyboardFocus = true;
    cell.dropShadow = 0;
  }

  /** Visually select this row */
  private _selectRow() {
    this._selected = true;
    let cell = this.cellAt(0);
    cell.background = "@primary";
    cell.textColor = "@primary:text";
    let isPreviewEmpty = !(
      this.previewText !== undefined ||
      this.previewIcon ||
      this._previewComponent ||
      this.previewActionText ||
      this.previewActionIcon
    );
    this.cellAt(1).background = isPreviewEmpty ? "@primary" : "@primary/20%";
  }

  /** Visually deselect this row */
  private _deselectRow() {
    this._selected = false;
    let cell = this.cellAt(0);
    cell.background = "";
    cell.textColor = "";
    this.cellAt(1).background = "";
  }

  private _selected = false;

  @observe
  static PropertyGridRowObserver = class {
    constructor(public readonly row: PropertyGridRow) {}
    onPropertyGridActionButtonClick() {
      this.row.propagateComponentEvent("Action");
    }
    onDoubleClick() {
      if (this.row.previewActionText || this.row.previewActionIcon) {
        this.row.propagateComponentEvent("Action");
      }
    }
    onFocusIn(e: ManagedEvent) {
      if (!this.row.isSelected()) {
        this.row.cellAt(0).propagateComponentEvent("Select");
      }
    }
    onSelect() {
      this.row._selectRow();
    }
    onDeselect() {
      this.row._deselectRow();
    }
    onArrowDownKeyPress(e: ManagedEvent) {
      if (e instanceof UIComponentEvent && e.source === this.row.cellAt(0)) {
        this.row.cellAt(0).requestFocusNext();
      }
    }
    onArrowUpKeyPress(e: ManagedEvent) {
      if (e instanceof UIComponentEvent && e.source === this.row.cellAt(0)) {
        this.row.cellAt(0).requestFocusPrevious();
      }
    }
    onArrowRightKeyPress() {
      if (this.row.collapsed) return;
      let field = this.row.cellAt(1);
      let lastChild = field instanceof UICell && field.content.last();
      if (lastChild) {
        if (lastChild instanceof UIComponent && lastChild.isFocusable()) {
          lastChild.requestFocus();
        } else {
          field.requestFocus();
        }
      }
    }
    onArrowLeftKeyPress(e: ManagedEvent) {
      if (e instanceof UIComponentEvent && !(e.source instanceof UITextField)) {
        this.row.cellAt(0).requestFocus();
      }
    }
    onEscapeKeyPress() {
      this.row.cellAt(0).requestFocus();
    }
  };
}

export namespace PropertyGridRow {
  export interface Presets extends TreeGridRow.Presets {
    /** Name label text for this row */
    label?: string;
    /** Text style used for the name label */
    labelTextStyle?: UIStyle.TextStyle;
    /** Preview cell icon (in front of preview text) */
    previewIcon?: string;
    /** Preview cell icon size */
    previewIconSize?: string | number;
    /** Preview cell icon margin */
    previewIconMargin?: string | number;
    /** Preview cell icon color */
    previewIconColor?: string;
    /** Preview cell text */
    previewText?: string;
    /** Text style used for the preview cell text */
    previewTextStyle?: UIStyle.TextStyle;
    /** Action button text label */
    previewActionText?: string;
    /** Action button icon label */
    previewActionIcon?: string;
    /** Action button icon size */
    previewActionIconSize?: string | number;
    /** Action button icon margin */
    previewActionIconMargin?: string | number;
    /** Action button icon color */
    previewActionIconColor?: string;
    /** Action button style */
    previewActionButtonStyle?: UIStyle;
    /** Event handler that is called when the property preview action has been triggered */
    onAction?: UIComponentEventHandler<PropertyGridRow>;
  }
}
