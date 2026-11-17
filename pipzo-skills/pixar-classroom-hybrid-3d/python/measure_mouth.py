# Natural mouth opening per frame from a MiniMax lip-sync clip.
# Track the upper face (eyes+nose) by template matching, mouth box sits at a fixed offset below it.
import cv2, numpy as np, sys, json
src, out, fx, fy, fw, fh = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:7])  # mouth box in frame 0
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS)
ok, f0 = cap.read(); g0 = cv2.cvtColor(f0, cv2.COLOR_BGR2GRAY)
# template: region above mouth (nose + eyes)
tx, ty, tw, th = fx - fw // 2, fy - int(fh * 2.6), fw * 2, int(fh * 2.4)
tpl = g0[ty:ty + th, tx:tx + tw].copy(); px, py = tx, ty
res = []; boxes = []
cap.set(1, 0)
while True:
    ok, fr = cap.read()
    if not ok: break
    g = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY)
    sx0, sy0 = max(0, px - 40), max(0, py - 40)
    win = g[sy0:py + th + 40, sx0:px + tw + 40]
    r = cv2.matchTemplate(win, tpl, cv2.TM_CCOEFF_NORMED); _, mv, _, ml = cv2.minMaxLoc(r)
    px, py = sx0 + ml[0], sy0 + ml[1]
    mx, my = px + (fx - tx), py + (fy - ty)
    boxes.append((mx, my))
    hsv = cv2.cvtColor(fr[my:my + fh, mx:mx + fw], cv2.COLOR_BGR2HSV)
    dark = (hsv[..., 2] < 110) & (hsv[..., 1] > 90)
    teeth = (hsv[..., 2] > 200) & (hsv[..., 1] < 60)
    o = dark | teeth
    rows = np.where(o.sum(1) > 1)[0]; cols = np.where(o.sum(0) > 1)[0]
    gap = (rows.max() - rows.min() + 1) / fw if len(rows) else 0.0
    wid = (cols.max() - cols.min() + 1) / fw if len(cols) else 0.0
    res.append([round(float(o.sum()) / (fw * fh), 4), round(float(gap), 4), round(float(wid), 4), round(float(dark.sum()) / (fw * fh), 4), round(float(teeth.sum()) / (fw * fh), 4), round(float(mv), 3)])
json.dump({'fps': fps, 'v': res, 'boxes': boxes, 'fw': fw, 'fh': fh}, open(out, 'w'))
print(src, len(res), 'min match', min(r[5] for r in res))
