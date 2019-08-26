import { AppHeader, AppLayout, AppTitle } from "@typescene/web-nav";
import JSX, { bind } from "typescene/JSX";
import {
  PropertyGrid,
  PropertyGridDropdownRow,
  PropertyGridGroup,
  PropertyGridRow,
  PropertyGridTextFieldRow,
  PropertyGridToggleRow,
} from "../../dist";

const _iconCollapsed = '<svg viewBox="0 0 16 16"><polyline points="1 3 8 8 1 13"/></svg>';
const _iconExpanded = '<svg viewBox="0 0 16 16"><polyline points="8 3 8 11 0 11"/></svg>';

export default (
  <AppLayout background="#eee">
    <AppHeader>
      <AppTitle>Property grid demo</AppTitle>
    </AppHeader>
    <flowcell
      background="@background"
      dimensions={{ width: "100%", maxWidth: 600 }}
      position={{ gravity: "center" }}
    >
      <formcontext formContext={bind("context")}>
        <PropertyGrid
          rowSeparator={{ type: "line" }}
          iconCollapsed={_iconCollapsed}
          iconExpanded={_iconExpanded}
          rows={[
            PropertyGridGroup.with(
              {
                collapsed: true,
                label: "Collapsed Group",
                labelTextStyle: { bold: true },
              },
              PropertyGridRow.with({
                label: "Static row",
                previewText: "This does nothing",
                previewIcon: "close",
                previewIconColor: "@black+80%",
              }),
              PropertyGridRow.with({
                label: "Add an item...",
                previewActionIcon: "+",
                onAction: "addItemAbove()",
              })
            ),
            PropertyGridGroup.with(
              {
                label: "Group",
                labelTextStyle: { bold: true },
              },
              PropertyGridTextFieldRow.with({
                label: "Non-form text",
                previewText: "Preview text",
                previewActionIcon: "...",
                onAction: "previewAction()",
              }),
              PropertyGridTextFieldRow.with({
                label: "Form context text",
                name: "text",
              }),
              PropertyGridTextFieldRow.with({
                label: "Linked text",
                name: "text",
              }),
              PropertyGridToggleRow.with({
                label: "Toggle",
                name: "bool",
                toggleLabel: "Toggle",
              }),
              PropertyGridTextFieldRow.with({
                label: "Toggle value",
                name: "bool",
                readonly: true,
                previewTextStyle: { color: "@text/50%" },
              }),
              PropertyGridTextFieldRow.with({
                label: "Number",
                name: "number",
                type: "number",
              }),
              PropertyGridDropdownRow.with({
                label: "Make a choice",
                name: "choice",
                previewText: "Select...",
                options: bind("options"),
                onBuildMenu: "buildOptionsMenu()",
              })
            ),
          ]}
        />
      </formcontext>
    </flowcell>
  </AppLayout>
);
