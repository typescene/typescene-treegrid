# TreeGridView & PropertyGridView

This package contains the `TreeGridView` and `PropertyGridView` components. These can be used to display hierarchical lists and grid controls in a Typescene application.

NOTE: if you're looking for an introduction to how components should be written using Typescene, this isn't the right place. For various reasons (see Notes below), the implementation of a collapsible tree-grid is very complex. For a better example, take a look at the [`typescene/sample-project-todo`](https://github.com/typescene/sample-project-todo) repository instead.

## Installation & Usage

**Note:** This component requires [Typescene](https://github.com/typescene/typescene).

To add one of these components to your application, add the NPM package first:

`npm i -D @typescene/treegrid`

Then import the `TreeGridView` and/or `PropertyGridView` classes (or `TreeGrid` and/or `PropertyGrid` for JSX views) using an import statement such as:

`import { PropertyGrid, PropertyGridRow } from "@typescene/treegrid"`

### JSX

Note that _rows_ within grids are NOT represented by UI components, hence these cannot be preset using JSX syntax.

The correct way to include a property grid component in JSX is as follows:

```tsx
import { PropertyGrid, PropertyGridRow } from "@typescene/treegrid";

export default (
  <PropertyGrid
    rows={[
      PropertyGridRow.with({
        label: "First row",
        // ...
      }),
      // ... etc.
    ]}
  />
);
```

## Demo

The `demo/` folder contains a working example.

<img width="600" src="screenshot.png" alt="Screenshot" />

Clone the source repository, and run the following commands:

- `npm install`
- `npm run build`
- `cd demo`
- `npm install`
- `npm start`

## Notes

The code in this repository is relatively complex, and probably not a good first project to look at (the source code, that is) if you're new to Typescene. There are two primary reasons for this:

1. Because of the way the Document Object Model (DOM) works, and specifically the limitations of the Flexible Box Model (aka flexbox, which is what Typescene uses to render its UI components), the grid is rendered as a set of _columns_ rather than simply as rows. This means that all cells within a column are guaranteed to be of the same width, however it also means that the implementation for updating cells within one row is _much_ more complicated than otherwise.
2. For efficiency, the implementation takes care of updating only the necessary cells when showing/hiding or updating particular rows. This is done using a linked list of visible cells, which adds lots of complexity.

