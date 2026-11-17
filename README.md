# Minecraft Roofs

A full-screen Minecraft roof cross-section generator with a French interface. Pick one of eight shapes and a material, then choose an odd width for a single-block ridge or an even width for a two-block ridge. The diagram and PNG show one cross-section. On mobile, open Settings to display the drawer.

The material catalog covers the 97 families with both stairs and slabs in the official Java Edition 26.3 client block states. The preview uses solid material colors. Inventory swatches use textures drawn by the app. The bundled Monocraft font by Idrees Hassan is provided under the [SIL Open Font License](assets/Monocraft-LICENSE.txt).

## Run locally

Serve the project folder with any static HTTP server. For example:

```sh
python3 -m http.server 8000
```

Open [localhost:8000](http://localhost:8000).

## Publish

GitHub Pages serves the root of the `main` branch. No build or package installation is required. All asset paths are relative to support project URLs on GitHub Pages.
