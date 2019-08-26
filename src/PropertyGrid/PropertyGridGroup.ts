import { ManagedEvent, UIButton, UIComponentEvent } from "typescene";
import { PropertyGridRow } from "./PropertyGridRow";

/** Represents a group of property grid rows that can be collapsed and expanded */
export class PropertyGridGroup extends PropertyGridRow {
  showExpandedIcon = true;
}
PropertyGridGroup.handle({
  Click(e: ManagedEvent) {
    if (e instanceof UIComponentEvent && !(e.source instanceof UIButton)) {
      this.collapsed = !this.collapsed;
      this.populateCell(this.cellAt(0));
    }
  },
  EnterKeyPress(e: ManagedEvent) {
    if (e instanceof UIComponentEvent && !(e.source instanceof UIButton)) {
      this.collapsed = !this.collapsed;
      this.populateCell(this.cellAt(0));
    }
  },
  ArrowRightKeyPress() {
    this.collapsed = false;
    this.populateCell(this.cellAt(0));
  },
  ArrowLeftKeyPress(e: ManagedEvent) {
    if (e instanceof UIComponentEvent && e.source === this.cellAt(0)) {
      this.collapsed = true;
      this.populateCell(this.cellAt(0));
    }
  },
});
