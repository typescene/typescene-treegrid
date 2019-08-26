import {
  ManagedEvent,
  UIBorderlessTextField,
  UIComponentEvent,
  UISpacer,
  UIStyle,
  UITextField,
} from "typescene";
import { TreeGridRowCell } from "../TreeGrid";
import { PropertyGridView } from "./PropertyGrid";
import { PropertyGridRow } from "./PropertyGridRow";

/** Text field constructor */
const PropertyGridTextField = UIBorderlessTextField.with({
  style: UIStyle.create("PropertyGridTextField", {
    position: { gravity: "center" },
  }),
  onRendered() {
    this.requestFocus();
  },
});

/** Represents a property grid row with a text input field; the field value can be bound to a form context property using the `name` property */
export class PropertyGridTextFieldRow extends PropertyGridRow {
  static preset(presets: PropertyGridTextFieldRow.Presets) {
    return super.preset(presets);
  }

  showExpandedIcon = false;

  /** Form context property name */
  name?: string;

  /** Text field input type */
  type?: UITextField.InputType;

  /** True if text should not be changed */
  readonly?: boolean;

  populateCell(cell: TreeGridRowCell) {
    if (cell.columnIndex === 1) {
      let grid = this.getParentComponent(PropertyGridView);
      if (this.name && grid && grid.formContext) {
        let value = (grid.formContext as any)[this.name];
        if (typeof value === "number" && isNaN(value)) value = "";
        else if (value === undefined) value = "";
        this.previewText = value;
      }
      this.updateOnFormContextChange = true;
    }
    super.populateCell(cell);
  }

  /** Replace the preview cell content with a text field */
  showTextField() {
    if (this.readonly) return;
    this.updateOnFormContextChange = false;
    let grid = this.getParentComponent(PropertyGridView);
    let padding = grid ? grid.horizontalCellPadding : 0;
    let spacer = new UISpacer(padding);
    let fieldCell = this.cellAt(1);
    let textField = new PropertyGridTextField();
    if (this.type) textField.type = this.type;
    if (this.name) textField.name = this.name;
    else textField.value = this.previewText || "";
    fieldCell.content.replace([spacer, textField]);
    fieldCell.background = "@background";
    fieldCell.borderColor = "@primary";
    fieldCell.borderThickness = { bottom: 2 };
    fieldCell.dropShadow = 0.3;
    let labelCell = this.cellAt(0);
    labelCell.background = "@primary/20%";
    labelCell.textColor = "";
  }
}
PropertyGridTextFieldRow.handle({
  FocusIn(e: ManagedEvent) {
    if (e instanceof UIComponentEvent && e.source === this.cellAt(1)) {
      this.showTextField();
    }
  },
  FocusOut(e: ManagedEvent) {
    if (e instanceof UIComponentEvent && e.source instanceof UITextField) {
      this.refresh();
    }
  },
  EnterKeyPress(e: ManagedEvent) {
    if (e instanceof UIComponentEvent) {
      if (e.source instanceof TreeGridRowCell) {
        this.showTextField();
      } else if (e.source instanceof UITextField) {
        this.refresh();
        this.cellAt(0).requestFocus();
      }
    }
  },
  Change(e: ManagedEvent) {
    if (e instanceof UIComponentEvent && e.source instanceof UITextField) {
      let value = e.source.value;
      if (typeof value === "number" && isNaN(value)) value = "";
      else if (value === undefined) value = "";
      this.previewText = value;
    }
  },
});

export namespace PropertyGridTextFieldRow {
  export interface Presets extends PropertyGridRow.Presets {
    /** Form context property name */
    name?: string;
    /** Text field input type */
    type?: UITextField.InputType;
    /** True if text should not be changed */
    readonly?: boolean;
  }
}
