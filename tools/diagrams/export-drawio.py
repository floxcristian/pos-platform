"""Convert the seven existing C4 boards into native, editable draw.io XML.

Uses only the Python standard library. Keeps source coordinates and text;
node labels follow nodes and relationship labels follow their connectors.
"""
from pathlib import Path
import copy
import json
import math
import xml.etree.ElementTree as ET
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "docs/diagramas-excalidraw"
OUTPUT = ROOT / "docs/diagramas-drawio"
NAMES = ["C1 · Contexto", "C2 · Contenedores", "C3 · Backend de sucursal",
         "C3 · Sincronizador", "Despliegue", "Flujo de precios", "Flujo de venta"]


def num(value):
    assert math.isfinite(value)
    return f"{value:.6f}".rstrip("0").rstrip(".") or "0"


def elem(tag, owner, **attrs):
    return ET.SubElement(owner, tag, {k: str(v) for k, v in attrs.items()})


def geometry(parent, x, y, width, height):
    return elem("mxGeometry", parent, x=num(x), y=num(y), width=num(width),
                height=num(height), **{"as": "geometry"})


def midpoint(points):
    lengths = [math.dist(a, b) for a, b in zip(points, points[1:])]
    remaining = sum(lengths) / 2
    for a, b, length in zip(points, points[1:], lengths):
        if length and remaining <= length:
            return [a[i] + (b[i] - a[i]) * remaining / length for i in (0, 1)]
        remaining -= length
    return points[-1]


def convert(scene):
    elements = [e for e in scene["elements"] if not e.get("isDeleted")]
    by_id = {e["id"]: e for e in elements}
    assert len(by_id) == len(elements)
    assert all(e["type"] in ("rectangle", "text", "line", "arrow") for e in elements)
    assert all(not e.get("angle") for e in elements), "Rotated sources need explicit handling"
    width = math.ceil(max(e["x"] + e["width"] for e in elements) + 64)
    height = math.ceil(max(e["y"] + e["height"] for e in elements) + 64)
    model = ET.Element("mxGraphModel", grid="1", gridSize="10", guides="1", tooltips="1",
                       connect="1", arrows="1", fold="1", page="1", pageScale="1",
                       pageWidth=str(width), pageHeight=str(height), math="0", shadow="0", background="#ffffff")
    root = elem("root", model)
    elem("mxCell", root, id="0")
    elem("mxCell", root, id="1", parent="0")
    groups = {}
    for e in elements:
        assert len(e.get("groupIds", [])) <= 1, "Nested groups need explicit handling"
        if e.get("groupIds"):
            groups.setdefault(e["groupIds"][0], []).append(e)
    group_parent = {}
    for gid, members in groups.items():
        edge = next((e for e in members if e["type"] == "arrow"), None)
        if edge:
            points = [[edge["x"] + p[0], edge["y"] + p[1]] for p in edge["points"]]
            group_parent[gid] = (edge["id"], midpoint(points), True)
        else:
            x, y = min(e["x"] for e in members), min(e["y"] for e in members)
            w = max(e["x"] + e["width"] for e in members) - x
            h = max(e["y"] + e["height"] for e in members) - y
            group = elem("mxCell", root, id="group-" + gid, value="", parent="1", vertex="1",
                         style="group;html=0;container=1;collapsible=0;recursiveResize=0;")
            geometry(group, x, y, w, h)
            group_parent[gid] = ("group-" + gid, (x, y), False)

    for e in elements:
        parent, origin, relative = "1", (0, 0), False
        if e.get("containerId"):
            parent = e["containerId"]
            origin = (by_id[parent]["x"], by_id[parent]["y"])
        elif e.get("groupIds") and e["type"] != "arrow":
            parent, origin, relative = group_parent[e["groupIds"][0]]
        style = ["html=0", "fontFamily=Arial", "shadow=0", "spacing=0",
                 f"opacity={e['opacity']}", f"strokeColor={e['strokeColor']}",
                 f"strokeWidth={e['strokeWidth']}"]
        if e["strokeStyle"] != "solid":
            style += ["dashed=1", "dashPattern=6 4"]
        attrs = dict(id=e["id"], value=e.get("text", ""), parent=parent)
        if e["type"] in ("arrow", "line"):
            attrs["edge"] = "1"
            style += ["edgeStyle=none", "rounded=0", "startArrow=none",
                      "endArrow=open" if e.get("endArrowhead") else "endArrow=none", "endSize=10"]
            points = [[e["x"] + p[0], e["y"] + p[1]] for p in e["points"]]
            for binding, endpoint, terminal, prefix in [
                (e.get("startBinding"), points[0], "source", "exit"),
                (e.get("endBinding"), points[-1], "target", "entry")]:
                if binding:
                    node = by_id[binding["elementId"]]
                    attrs[terminal] = node["id"]
                    style += [f"{prefix}X={num((endpoint[0]-node['x'])/node['width'])}",
                              f"{prefix}Y={num((endpoint[1]-node['y'])/node['height'])}",
                              f"{prefix}Perimeter=0"]
            cell = elem("mxCell", root, **attrs, style=";".join(style) + ";")
            geo = elem("mxGeometry", cell, relative="1", **{"as": "geometry"})
            for point, kind in [(points[0], "sourcePoint"), (points[-1], "targetPoint")]:
                elem("mxPoint", geo, x=num(point[0]), y=num(point[1]), **{"as": kind})
            if len(points) > 2:
                array = elem("Array", geo, **{"as": "points"})
                for point in points[1:-1]:
                    elem("mxPoint", array, x=num(point[0]), y=num(point[1]))
        else:
            attrs["vertex"] = "1"
            if e["type"] == "text":
                # mxGraph's plain-text line spacing differs from Excalidraw's.
                # Leave headroom in bound node labels, especially white text.
                font_size = e["fontSize"] * (0.9 if e.get("containerId") else 1)
                style += ["shape=text", "strokeColor=none", "fillColor=none", "whiteSpace=nowrap",
                          "overflow=visible", f"fontColor={e['strokeColor']}",
                          f"fontSize={num(font_size)}", f"align={e['textAlign']}",
                          "verticalAlign=middle" if e.get("containerId") else "verticalAlign=top"]
            else:
                fill = e["backgroundColor"]
                style += [f"fillColor={'none' if fill == 'transparent' else fill}",
                          "rounded=1" if e.get("roundness") else "rounded=0", "arcSize=8"]
            cell = elem("mxCell", root, **attrs, style=";".join(style) + ";")
            if relative:
                # Edge children use the path midpoint as their origin, so labels travel with it.
                geo = geometry(cell, 0, 0, e["width"], e["height"])
                geo.set("relative", "1")
                elem("mxPoint", geo, x=num(e["x"]-origin[0]), y=num(e["y"]-origin[1]), **{"as": "offset"})
            else:
                geometry(cell, e["x"]-origin[0], e["y"]-origin[1], e["width"], e["height"])

    cells = {c.attrib["id"]: c for c in root}
    for e in elements:
        c = cells[e["id"]]
        assert c.get("value") == e.get("text", ""), "Text must be lossless"
        for key in ("parent", "source", "target"):
            if c.get(key):
                assert c.get(key) in cells
    return model


def write_file(path, pages):
    doc = ET.Element("mxfile", host="app.diagrams.net", agent="POS C4 local export", type="device", pages=str(len(pages)))
    for index, (name, model) in enumerate(pages, 1):
        diagram = elem("diagram", doc, id=f"c4-{index}", name=name)
        diagram.append(copy.deepcopy(model))
    ET.indent(doc, space="  ")
    ET.ElementTree(doc).write(path, encoding="utf-8", xml_declaration=True)
    assert len(ET.parse(path).getroot().findall("diagram")) == len(pages)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    sources = sorted(p for p in SOURCE.glob("*.excalidraw") if not p.name.startswith("00-"))
    assert len(sources) == len(NAMES)
    pages = []
    for path, name in zip(sources, NAMES):
        scene = json.loads(path.read_text(encoding="utf-8"))
        model = convert(scene)
        pages.append((name, model))
        write_file(OUTPUT / (path.stem + ".drawio"), [(name, model)])
        print(f"{path.stem}.drawio: {len(scene['elements'])} elementos conservados")
    write_file(OUTPUT / "00-atlas-completo.drawio", pages)
    with ZipFile(OUTPUT / "diagramas-c4-drawio.zip", "w", ZIP_DEFLATED) as archive:
        for path in sorted(OUTPUT.iterdir()):
            if path.suffix == ".drawio" or path.name == "README.md":
                archive.write(path, path.name)
    print("Atlas de 7 páginas y ZIP guardados en", OUTPUT)


if __name__ == "__main__":
    main()
