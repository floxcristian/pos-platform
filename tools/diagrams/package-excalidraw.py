"""Package the editable collection together with its documentation sources."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[2]
collection = root / "docs" / "diagramas-excalidraw"
output = collection / "diagramas-c4-excalidraw.zip"
files = sorted(p for p in collection.iterdir() if p.is_file() and p.suffix in {".excalidraw", ".svg", ".html", ".md"})
with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
    for item in files:
        archive.write(item, "pos-c4/docs/diagramas-excalidraw/" + item.name)
    # These are the canonical sources directly cited by the collection. Retain
    # the repository layout so their relative links remain useful in POS Platform.
    for item in sorted((root / "docs").glob("*.md")):
        archive.write(item, "pos-c4/docs/" + item.name)
    archive.writestr("pos-c4/ABRIR.txt", "Abre docs/diagramas-excalidraw/index.html para consultar la galeria.\nAbre cualquier .excalidraw con Archivo > Abrir en Excalidraw.\nLas fuentes incluidas son documentos de referencia; sus enlaces al resto del repositorio se consultan en POS Platform.\n")
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert len([n for n in archive.namelist() if n.endswith(".excalidraw")]) == 8
print(f"Coleccion Excalidraw creada y verificada: {output} ({output.stat().st_size:,} bytes)")
