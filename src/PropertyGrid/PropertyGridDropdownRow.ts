import {
  UICell,
  UIComponentEvent,
  UIComponentEventHandler,
  UIExpandedLabel,
  UIMenu,
  UIMenuBuilder,
  UIMenuItemSelectedEvent,
  UIModalController,
  UIRenderPlacement,
  UIStyle,
} from "typescene";
import { TreeGridRowCell } from "../TreeGrid";
import { PropertyGridView } from "./PropertyGrid";
import { PropertyGridRow } from "./PropertyGridRow";

/** Dropdown option label constructor */
const PropertyGridDropdownLabel = UIExpandedLabel.with({
  style: UIStyle.create("PropertyGridDropdown", {
    position: { gravity: "center" },
    textStyle: { lineHeight: 1.8 },
  }),
  iconAfter: true,
  icon: "expandDown",
  onClick: "+DropdownOpen",
});

/** Represents a property grid row with a dropdown menu selector; the selected value (key) can be bound to a form context property using the `name` property and `options` array */
export class PropertyGridDropdownRow extends PropertyGridRow {
  static preset(presets: PropertyGridDropdownRow.Presets) {
    return super.preset(presets);
  }

  showExpandedIcon = false;

  /** Form context property name */
  name?: string;

  /** Dropdown menu options; for advanced menus handle the `BuildMenu` and `SelectMenuItem` events */
  options?: { key: string; text: string }[];

  /** The last menu builder that has been made available by the `UIMenu` instance, if any; can be used within a `BuildMenu` event handler */
  menuBuilder?: UIMenuBuilder;

  populateCell(cell: TreeGridRowCell) {
    if (cell.columnIndex === 1) {
      let row = this;
      let key = "";
      let grid = this.getParentComponent(PropertyGridView);
      if (row.name && grid && grid.formContext) {
        key = grid.formContext.get(row.name);
        let option = row.options && row.options.filter(opt => opt.key === key)[0];
        if (option) this.previewText = option.text;
      }
      let Controller = UIModalController.with(
        { placement: UIRenderPlacement.DROPDOWN_COVER },
        PropertyGridDropdownLabel.with({
          text: this.previewText,
          onClick: "+ShowModal",
          onEnterKeyPress: "+ShowModal",
          allowKeyboardFocus: true,
        }),
        UIMenu.with({
          gravity: "stretch",
          onBuild() {
            row.menuBuilder = this.builder;
            if (row.options) this.builder.addSelectionGroup(row.options, key);
            row.propagateComponentEvent("BuildMenu");
          },
          onSelectMenuItem(e: UIMenuItemSelectedEvent) {
            if (row.name && grid && grid.formContext) {
              let key = e.key;
              let option = row.options && row.options.filter(opt => opt.key === key)[0];
              if (option) {
                grid.formContext.set(row.name, key, true);
              } else {
                row.previewText = e.key;
                row.populateCell(row.cellAt(1));
              }
            }
            row.emit(e);
          },
        })
      );
      this.setPreviewComponent(new Controller());
      this.updateOnFormContextChange = true;
    }
    super.populateCell(cell);
  }
}
PropertyGridDropdownRow.addEventHandler(function (e) {
  if (
    e.name === "EnterKeyPress" &&
    e instanceof UIComponentEvent &&
    e.source instanceof TreeGridRowCell
  ) {
    let field = this.cellAt(1);
    if (field instanceof UICell) {
      let controller = field.content
        .toArray()
        .filter(c => c instanceof UIModalController)[0] as UIModalController;
      controller &&
        controller.content &&
        controller.content.propagateComponentEvent("ShowModal");
    }
  }
});

export namespace PropertyGridDropdownRow {
  export interface Presets extends PropertyGridRow.Presets {
    /** Form context property name */
    name?: string;
    /** Dropdown menu options; for advanced menus handle the `BuildMenu` and `SelectMenuItem` events */
    options?: { key: string; text: string }[];
    /** Event handler that is called when the dropdown menu is being built */
    onBuildMenu?: UIComponentEventHandler<PropertyGridDropdownRow, UIComponentEvent>;
    /** Event handler that is called after a menu selection has been made (event type `UIMenuItemSelectedEvent`) */
    onSelectMenuItem?: UIComponentEventHandler<
      PropertyGridDropdownRow,
      UIMenuItemSelectedEvent
    >;
  }
}
