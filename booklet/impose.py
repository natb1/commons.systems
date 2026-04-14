from pypdf import PdfReader, PdfWriter, Transformation, PageObject
from pypdf.generic import DecodedStreamObject, NameObject
import copy

INPUT = "/Users/n8/Desktop/print_2Fprod_2Fmedia_2FLets_Slay_a_Dragon_booklet.pdf"
OUTPUT = "/Users/n8/Desktop/Lets_Slay_a_Dragon_booklet_imposed.pdf"

reader = PdfReader(INPUT)
n = len(reader.pages)

pad = (4 - n % 4) % 4
pages = list(reader.pages) + [None] * pad
total = len(pages)

pw = float(reader.pages[0].mediabox.width)
ph = float(reader.pages[0].mediabox.height)

sheet_w = pw * 2
sheet_h = ph
sheets = total // 4
writer = PdfWriter()


def add_clipping_to_page(page, clip_x, clip_y, clip_w, clip_h):
    contents = page.get_contents()
    if contents is None:
        return
    original_data = contents.get_data()
    prefix = f"q {clip_x} {clip_y} {clip_w} {clip_h} re W n\n".encode()
    suffix = b"\nQ"
    new_stream = DecodedStreamObject()
    new_stream.set_data(prefix + original_data + suffix)
    page[NameObject("/Contents")] = new_stream


def make_sheet(left_idx, right_idx):
    sheet = PageObject.create_blank_page(width=sheet_w, height=sheet_h)
    for src_idx, x_off in [(left_idx, 0), (right_idx, pw)]:
        src = pages[src_idx]
        if src is not None:
            p = copy.deepcopy(src)
            add_clipping_to_page(p, 0, 0, pw, ph)
            sheet.merge_transformed_page(p, Transformation().translate(x_off, 0))
    return sheet


# Build fronts and backs separately
fronts = []
backs = []
for i in range(sheets):
    front_left = total - 1 - 2 * i   # pages 12, 10, 8
    front_right = 2 * i              # pages 1, 3, 5
    back_left = 2 * i + 1            # pages 2, 4, 6
    back_right = total - 2 - 2 * i   # pages 11, 9, 7

    fronts.append(make_sheet(front_left, front_right))
    backs.append(make_sheet(back_left, back_right))

# Interleave fronts with REVERSED backs for manual duplex short-edge flip
reversed_backs = list(reversed(backs))
for i in range(sheets):
    writer.add_page(fronts[i])
    writer.add_page(reversed_backs[i])

with open(OUTPUT, "wb") as f:
    writer.write(f)

print(f"Created {OUTPUT}")
print(f"  {sheets} sheets, {sheets*2} sides")
print(f"  Sheet size: {sheet_w/72:.1f} x {sheet_h/72:.1f} inches")
print()
print("Print duplex, flip on SHORT edge (manual duplex).")
print()
print("PDF page order:")
for i in range(sheets):
    fi = i
    bi = sheets - 1 - i
    fl = total - 2*fi; fr = 2*fi + 1
    bl = 2*bi + 2; br = total - 1 - 2*bi
    print(f"  {2*i+1}. Front {fi+1}: [{fl}, {fr}]")
    print(f"  {2*i+2}. Back {bi+1}:  [{bl}, {br}]")
