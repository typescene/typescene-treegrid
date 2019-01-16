import { ComponentEvent, ManagedRecord, PageViewActivity } from "typescene";
import { PropertyGridDropdownRow, PropertyGridRow } from "../../../src/PropertyGrid";
import { TreeGridRow } from "../../../src/TreeGridRow";
import view from "./view";

// Property grid row component that is added dynamically to the property grid
const DynamicRemovableRow = PropertyGridRow.with({
    previewActionIcon: "close",
    previewActionIconColor: "@red",
    onAction() {
        let parent = this.getParentComponent(PropertyGridRow);
        parent && parent.rows.remove(this);
    }
})

export class MainActivity extends PageViewActivity.with(view) {
    path = "";

    /** Form context data bound to property grid rows */
    context = ManagedRecord.create({
        text: "Example text",
        number: 123,
        bool: true,
        choice: ""
    });

    /** Options bound to the dropdown property grid row for `choice` */
    options = [
        { key: "one", text: "First option" },
        { key: "two", text: "Second option" },
        { key: "three", text: "Third option" }
    ];

    /** Row number used in the method below */
    private _rowNumber = 1;

    /** Add a property grid row above the current property grid row */
    addItemAbove(e: ComponentEvent) {
        let parent = (e.source as TreeGridRow).getParentComponent(TreeGridRow);
        if (parent) {
            let row = new DynamicRemovableRow();
            row.label = "Row " + this._rowNumber++;
            row.previewText = "(Added)";
            parent.rows.insert(row, e.source as any);
        }
    }

    /** `Action` event handler */
    previewAction() {
        this.showConfirmationDialogAsync("You clicked the (...) action!");
    }

    /** Add on to the options menu (`BuildMenu` event handler) */
    buildOptionsMenu(e: ComponentEvent) {
        if (e.source instanceof PropertyGridDropdownRow) {
            let builder = e.source.menuBuilder;
            if (!builder) return;
            builder.addSeparator();
            builder.addOption("more", "More fake options...");
        }
    }
}
