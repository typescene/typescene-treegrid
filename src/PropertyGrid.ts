import { ComponentConstructor, ManagedChangeEvent, ManagedEvent, UIBorderlessTextField, UIButton, UICell, UIComponent, UIComponentEvent, UIComponentEventHandler, UIExpandedLabel, UILabel, UIMenu, UIMenuBuilder, UIMenuItemSelectedEvent, UIModalController, UIRenderable, UIRenderPlacement, UISpacer, UIStyle, UITextField, UIToggle } from "typescene";
import { TreeGrid } from "./TreeGrid";
import { TreeGridRow, TreeGridRowCell } from "./TreeGridRow";

/** Helper function that converts any value into a single line of text */
function singleLineOfText(s = "") {
    return String(s).replace(/\r\n|\n\r|\r|\n/g, " ");
}

/** UIStyle instance used for property grid labels */
const propertyGridLabelStyle = UIStyle.create("PropertyGridLabel", {
    position: { gravity: "center" },
    textStyle: { lineBreakMode: "ellipsis" }
});

/** Action button constructor */
const PropertyGridActionButton = UIButton.with({
    onClick: "+PropertyGridActionButtonClick",
    style: UIStyle.create("PropertyGridAction", {
        controlStyle: { background: "transparent", borderRadius: 0 },
        dimensions: { minWidth: 0, height: 32 }
    })
});

/** Text field constructor */
const PropertyGridTextField = UIBorderlessTextField.with({
    position: { gravity: "center" },
    onRendered() { this.requestFocus() }
});

/** Toggle component constructor */
const PropertyGridToggle = UIToggle.with({
    position: { gravity: "center" }
});

/** Dropdown option label constructor */
const PropertyGridDropdownLabel = UIExpandedLabel.with({
    position: { gravity: "center" },
    textStyle: { lineHeight: 1.8 },
    iconAfter: true,
    icon: "expandDown",
    onClick: "+DropdownOpen"
})

/** Represents a single row within a property grid */
export class PropertyGridRow extends TreeGridRow {
    static preset(presets: PropertyGridRow.Presets,
        ...rows: ComponentConstructor<PropertyGridRow>[]) {
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

    /** Set to true if this row should be propagated when the `formContext` bound to the `PropertyGrid` itself emits a change event; automatically enabled for rows with an input field and a value for the `name` property */
    updateOnFormContextChange?: boolean;

    /** Refresh all cells in this row (only) */
    refresh() {
        let numCells = this.cellCount;
        for (let i = 0; i < numCells; i++) {
            let cell = this.cellAt(i);
            this.populateCell(cell);
        }
    }

    /** Visually select this row */
    selectRow() {
        this._selected = true;
        let cell = this.cellAt(0);
        cell.background = "@primary";
        cell.textColor = "@primary:text";
        let isPreviewEmpty = !(this.previewText !== undefined || this.previewIcon || this._previewComponent || this.previewActionText || this.previewActionIcon);
        this.cellAt(1).background = isPreviewEmpty ? "@primary" : "@primary/20%";
    }

    /** Visually deselect this row */
    deselectRow() {
        this._selected = false;
        let cell = this.cellAt(0);
        cell.background = "";
        cell.textColor = "";
        this.cellAt(1).background = "";
    }

    /** Returns true if this row is currently selected */
    isSelected() { return this._selected }
    private _selected = false;

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
        let grid = this.getParentComponent(PropertyGrid);
        let padding = grid ? grid.horizontalCellPadding : 0;
        let group = this.getParentComponent(PropertyGridRow);
        this.groupLevel = group ? group.groupLevel + 1 : 0;
        let spacer = new UISpacer(0);
        spacer.dimensions = { grow: 0, shrink: 0, width: 16 * this.groupLevel + padding };

        // create the label itself
        let label = new UILabel(singleLineOfText(this.label));
        label.style.mixin(propertyGridLabelStyle);
        if (this.labelTextStyle) label.textStyle = this.labelTextStyle;
        label.icon = grid ? this.collapsed ? grid.iconCollapsed :
            this.showExpandedIcon ? grid.iconExpanded : "" : "";
        label.iconSize = 16;
        label.iconMargin = 0;

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
        let grid = this.getParentComponent(PropertyGrid);
        let padding = grid ? grid.horizontalCellPadding : 0;
        let spacer = new UISpacer(padding);
        cell.content.add(spacer);

        // add component, or preview label and/or icon
        if (this._previewComponent) {
            cell.content.add(this._previewComponent, new UISpacer(padding));
        }
        else if (this.previewText || this.previewIcon || !this.showExpandedIcon) {
            let label = new UILabel(singleLineOfText(this.previewText));
            label.shrinkwrap = false;
            label.style = label.style.mixin(propertyGridLabelStyle);
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
        if (this.previewText !== undefined || this.previewIcon || this._previewComponent ||
            this.previewActionText || this.previewActionIcon) {
            cell.borderColor = "@separator";
            cell.borderThickness = { x: 1 };
        }
        else {
            cell.borderThickness = 0;
        }
        cell.background = this._selected ? "@primary/20%" : "";
        cell.allowKeyboardFocus = true;
        cell.dropShadow = 0;
    }
}
PropertyGridRow.handle({
    PropertyGridActionButtonClick() {
        this.propagateComponentEvent("Action");
    },
    DoubleClick() {
        if (this.previewActionText || this.previewActionIcon) {
            this.propagateComponentEvent("Action");
        }
    },
    FocusIn(e: ManagedEvent) {
        if (!this.isSelected()) {
            this.cellAt(0).propagateComponentEvent("Select");
        }
    },
    Select() {
        this.selectRow();
    },
    Deselect() {
        this.deselectRow();
    },
    ArrowDownKeyPress(e: ManagedEvent) {
        if (e instanceof UIComponentEvent && e.source === this.cellAt(0)) {
            this.cellAt(0).requestFocusNext();
        }
    },
    ArrowUpKeyPress(e: ManagedEvent) {
        if (e instanceof UIComponentEvent && e.source === this.cellAt(0)) {
            this.cellAt(0).requestFocusPrevious();
        }
    },
    ArrowRightKeyPress() {
        if (this.collapsed) return;
        let field = this.cellAt(1);
        let lastChild = (field instanceof UICell) && field.content.last();
        if (lastChild) {
            if (lastChild instanceof UIComponent && lastChild.isFocusable()) {
                lastChild.requestFocus();
            }
            else {
                field.requestFocus();
            }
        }
    },
    ArrowLeftKeyPress(e: ManagedEvent) {
        if (e instanceof UIComponentEvent && !(e.source instanceof UITextField)) {
            this.cellAt(0).requestFocus();
        }
    },
    EscapeKeyPress() {
        this.cellAt(0).requestFocus();
    }
});

namespace PropertyGridRow {
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
    }
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

    populateCell(cell: TreeGridRowCell) {
        if (cell.columnIndex === 1) {
            let grid = this.getParentComponent(TreeGrid);
            if (this.name && grid && grid.formContext) {
                this.previewText = (grid.formContext as any)[this.name];
            }
            this.updateOnFormContextChange = true;
        }
        super.populateCell(cell);
    }

    /** Replace the preview cell content with a text field */
    showTextField() {
        this.updateOnFormContextChange = false;
        let grid = this.getParentComponent(PropertyGrid);
        let padding = grid ? grid.horizontalCellPadding : 0;
        let spacer = new UISpacer(padding)
        let fieldCell = this.cellAt(1);
        let textField = new PropertyGridTextField();
        if (this.type) textField.type = this.type;
        if (this.name) textField.name = this.name;
        else textField.value = this.previewText || "";
        fieldCell.content.replace([ spacer, textField ]);
        fieldCell.background = "@background";
        fieldCell.borderColor = "@primary";
        fieldCell.borderThickness = { bottom: 2 };
        fieldCell.dropShadow = .3;
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
            }
            else if (e.source instanceof UITextField) {
                this.refresh();
                this.cellAt(0).requestFocus();
            }
        }
    },
    Change(e: ManagedEvent) {
        if (e instanceof UIComponentEvent && e.source instanceof UITextField) {
            this.previewText = e.source.value;
        }
    }
});

namespace PropertyGridTextFieldRow {
    export interface Presets extends PropertyGridRow.Presets {
        /** Form context property name */
        name?: string;
        /** Text field input type */
        type?: UITextField.InputType;
    }
}

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
PropertyGridToggleRow.handle({
    SpacebarPress(e: ManagedEvent) {
        if (e instanceof UIComponentEvent && e.source instanceof TreeGridRowCell) {
            this.cellAt(1).content.forEach(c => {
                if (c instanceof UIToggle) c.state = !c.state;
            });
        }
    }
});

namespace PropertyGridToggleRow {
    export interface Presets extends PropertyGridRow.Presets {
        /** Form context property name */
        name?: string;
        /** Toggle component label, displayed alongside the toggle input */
        toggleLabel?: string;
    }
}

/** Represents a property grid row with a dropdown menu selector; the selected value (key) can be bound to a form context property using the `name` property and `options` array */
export class PropertyGridDropdownRow extends PropertyGridRow {
    static preset(presets: PropertyGridDropdownRow.Presets) {
        return super.preset(presets);
    }

    showExpandedIcon = false;

    /** Form context property name */
    name?: string;

    /** Dropdown menu options; for advanced menus handle the `BuildMenu` and `SelectMenuItem` events */
    options?: { key: string; text: string; }[];

    /** The last menu builder that has been made available by the `UIMenu` instance, if any; can be used within a `BuildMenu` event handler */
    menuBuilder?: UIMenuBuilder;

    populateCell(cell: TreeGridRowCell) {
        if (cell.columnIndex === 1) {
            let row = this;
            let key = "";
            let grid = this.getParentComponent(TreeGrid);
            if (row.name && grid && grid.formContext) {
                key = (grid.formContext as any)[row.name];
                let option = row.options && row.options.filter(opt => opt.key === key)[0];
                if (option) this.previewText = option.text;
            }
            let Controller = UIModalController.with(
                { placement: UIRenderPlacement.DROPDOWN_COVER },
                PropertyGridDropdownLabel.with({
                    text: this.previewText,
                    onClick: "+ShowModal",
                    onEnterKeyPress: "+ShowModal",
                    allowKeyboardFocus: true
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
                                (grid.formContext as any)[row.name] = key;
                                grid.formContext.emit(ManagedChangeEvent.CHANGE);
                            }
                            else {
                                row.previewText = e.key;
                                row.populateCell(row.cellAt(1));
                            }
                        }
                        row.emit(e);
                    }
                }));
            this.setPreviewComponent(new Controller());
            this.updateOnFormContextChange = true;
        }
        super.populateCell(cell);
    }
}
PropertyGridDropdownRow.handle({
    EnterKeyPress(e: ManagedEvent) {
        if (e instanceof UIComponentEvent && e.source instanceof TreeGridRowCell) {
            let field = this.cellAt(1);
            if (field instanceof UICell) {
                let controller = field.content.toArray()
                    .filter(c => (c instanceof UIModalController))[0] as UIModalController;
                controller && controller.content && controller.content.propagateComponentEvent("ShowModal");
            }
        }
    }
});

namespace PropertyGridDropdownRow {
    export interface Presets extends PropertyGridRow.Presets {
        /** Form context property name */
        name?: string;
        /** Dropdown menu options; for advanced menus handle the `BuildMenu` and `SelectMenuItem` events */
        options?: { key: string; text: string; }[];
        /** Event handler that is called when the dropdown menu is being built */
        onBuildMenu?: UIComponentEventHandler<PropertyGridDropdownRow, UIComponentEvent>;
        /** Event handler that is called after a menu selection has been made (event type `UIMenuItemSelectedEvent`) */
        onSelectMenuItem?: UIComponentEventHandler<PropertyGridDropdownRow, UIMenuItemSelectedEvent>;
    }
}

/** Represents a two-column property grid with (nested) rows of property labels and inputs */
export class PropertyGrid extends TreeGrid<PropertyGridRow> {
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
    iconCollapsed = "›";
}
PropertyGrid.observe(class {
    constructor(public grid: PropertyGrid) { }
    onFormContextChange() {
        this.grid.getVisibleRows().forEach(r => {
            if (r.updateOnFormContextChange) {
                r.populateCell(r.cellAt(1));
            }
        });
    }
});

namespace PropertyGrid {
    export interface Presets extends TreeGrid.Presets {
        /** Horizontal padding for both label and preview rows, defaults to 8 */
        horizontalCellPadding: number;
        /** Icon to be displayed in front of expanded group row labels */
        iconExpanded: string;
        /** Icon to be displayed in front of collapsed group row labels */
        iconCollapsed: string;
    }
}
