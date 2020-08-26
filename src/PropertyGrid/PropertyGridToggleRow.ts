import { UIComponentEvent, UIStyle, UIToggle } from "typescene";
import { TreeGridRowCell } from "../TreeGrid";
import { PropertyGridRow } from "./PropertyGridRow";

/** Toggle component constructor */
const PropertyGridToggle = UIToggle.with({
  style: UIStyle.create("PropertyGridToggle", {
    position: { gravity: "center" },
  }),
});

/** Represents a property grid row with a toggle (checkbox) input; the toggle state can be bound to a form context property using the `name` property */
export class PropertyGridToggleRow extends PropertyGridRow {
  static preset(presets: PropertyGridToggleRow.Presets) {
    return super.preset(presets);
  }

  showExpandedIcon = false;

  /** Form context property name */
  name?: string;

  /** Toggle component label, displayed alongside the toggle input */
  toggleLabel?: string;

  populateCell(cell: TreeGridRowCell) {
    if (cell.columnIndex === 1) {
      let toggle = new PropertyGridToggle();
      if (this.toggleLabel) toggle.label = this.toggleLabel;
      if (this.name) toggle.name = this.name;
      this.setPreviewComponent(toggle);
      this.updateOnFormContextChange = true;
    }
    super.populateCell(cell);
  }
}

PropertyGridToggleRow.presetBindingsFrom(UIToggle);

PropertyGridToggleRow.addEventHandler(function (e) {
  if (
    e.name === "SpacebarPress" &&
    e instanceof UIComponentEvent &&
    e.source instanceof TreeGridRowCell
  ) {
    for (let c of this.cellAt(1).content.toArray()) {
      if (c instanceof UIToggle) {
        c.state = !c.state;
        break;
      }
    }
  }
});

export namespace PropertyGridToggleRow {
  export interface Presets extends PropertyGridRow.Presets {
    /** Form context property name */
    name?: string;
    /** Toggle component label, displayed alongside the toggle input */
    toggleLabel?: string;
  }
}
