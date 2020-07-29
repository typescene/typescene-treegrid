import { UIButton, UIComponentEvent } from "typescene";
import { PropertyGridRow } from "./PropertyGridRow";

/** Represents a group of property grid rows that can be collapsed and expanded */
export class PropertyGridGroup extends PropertyGridRow {
  showExpandedIcon = true;
}
PropertyGridGroup.addEventHandler(function (e) {
  switch (e.name) {
    case "Click":
      if (e instanceof UIComponentEvent && !(e.source instanceof UIButton)) {
        this.collapsed = !this.collapsed;
        this.populateCell(this.cellAt(0));
      }
      break;
    case "EnterKeyPress":
      if (e instanceof UIComponentEvent && !(e.source instanceof UIButton)) {
        this.collapsed = !this.collapsed;
        this.populateCell(this.cellAt(0));
      }
      break;
    case "ArrowRightKeyPress":
      this.collapsed = false;
      this.populateCell(this.cellAt(0));
      break;
    case "ArrowLeftKeyPress":
      if (e instanceof UIComponentEvent && e.source === this.cellAt(0)) {
        this.collapsed = true;
        this.populateCell(this.cellAt(0));
      }
  }
});
