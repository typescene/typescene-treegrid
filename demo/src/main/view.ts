import { TopNavBar } from "@typescene/web-nav";
import { HMR } from "@typescene/webapp";
import { bind, UICoverCell, UIFlowCell, UIFormContextController, UIScrollContainer, UISelectionController } from "typescene";
import { PropertyGrid, PropertyGridDropdownRow, PropertyGridGroup, PropertyGridRow, PropertyGridTextFieldRow, PropertyGridToggleRow } from "../../../src/PropertyGrid";

// Enable Hot Module Reloading for the view exported by this module:
HMR.enableViewReload(module)

export default UICoverCell.with(
    { background: "#eee" },
    TopNavBar.with({ title: "Property grid demo" }),
    UIScrollContainer.with(
        UIFormContextController.with(
            { formContext: bind("context") },
            UISelectionController.with(
                UIFlowCell.with(
                    {
                        background: "@background",
                        dimensions: { width: "100%", maxWidth: 600 },
                        position: { gravity: "center" }
                    },
                    PropertyGrid.with({
                        rows: [
                            PropertyGridGroup.with(
                                {
                                    collapsed: true,
                                    label: "Collapsed Group",
                                    labelTextStyle: { bold: true }
                                },
                                PropertyGridRow.with({
                                    label: "Static row",
                                    previewText: "This does nothing",
                                    previewIcon: "close",
                                    previewIconColor: "@grey"
                                }),
                                PropertyGridRow.with({
                                    label: "Add an item...",
                                    previewActionIcon: "+",
                                    onAction: "addItemAbove()"
                                }),
                            ),
                            PropertyGridGroup.with(
                                {
                                    label: "Group",
                                    labelTextStyle: { bold: true }
                                },
                                PropertyGridTextFieldRow.with({
                                    label: "Non-form text",
                                    previewText: "Preview text",
                                    previewActionIcon: "...",
                                    onAction: "previewAction()"
                                }),
                                PropertyGridTextFieldRow.with({
                                    label: "Form context text",
                                    name: "text"
                                }),
                                PropertyGridTextFieldRow.with({
                                    label: "Linked text",
                                    name: "text"
                                }),
                                PropertyGridToggleRow.with({
                                    label: "Toggle",
                                    name: "bool",
                                    toggleLabel: "Toggle"
                                }),
                                PropertyGridTextFieldRow.with({
                                    label: "Number",
                                    name: "number",
                                    type: "number"
                                }),
                                PropertyGridDropdownRow.with({
                                    label: "Make a choice",
                                    name: "choice",
                                    previewText: "Select...",
                                    options: bind("options"),
                                    onBuildMenu: "buildOptionsMenu()"
                                })
                            )
                        ],
                        rowSeparator: { type: "line" }
                    })
                )
            )
        )
    )
)
