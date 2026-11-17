# Minecraft Roofs

A full-screen Minecraft roof cross-section generator with a French interface. Pick one of eight shapes and a material, then choose an odd width for a single-block ridge or an even width for a two-block ridge. The diagram and PNG show one cross-section. On mobile, open Settings to display the drawer.

The material catalog covers the 97 families with both stairs and slabs in the official Java Edition 26.3 client block states. The preview uses solid material colors. Inventory swatches show the front face. Open **Textures vanilla** in the material picker to load the textures and crafting-table favicon from a local Minecraft Java `.jar` or resource pack `.zip`. The generated textures are used until a file is imported. The bundled Monocraft font by Idrees Hassan is provided under the [SIL Open Font License](assets/Monocraft-LICENSE.txt).

Open the avatar menu to switch between day and night and the four seasons. Landscapes and the default button click are generated in the browser. A local OGG click file can be loaded under **Son des menus**. Appearance and imports are saved in the current browser when storage is available. In a standard launcher installation, the Java archive is under `versions/<version>/<version>.jar` in the Minecraft folder. The Java 26.3 original menu click is stored under `assets/objects/34/3455ca942556c7d5eac7dd5e458e7fb3bad564c9`; copy it with an `.ogg` suffix before importing it.

Scroll on a dimension slider or edit its block count. The width respects the selected ridge parity. **Exporter en PNG** previews the title, background color, roof details and quantities before downloading a 1600 × 900 image.

## Run locally

Serve the project folder with any static HTTP server. For example:

```sh
python3 -m http.server 8000
```

Open [localhost:8000](http://localhost:8000).

## Publish

GitHub Pages serves the root of the `main` branch. No build or package installation is required. All asset paths are relative to support project URLs on GitHub Pages.
