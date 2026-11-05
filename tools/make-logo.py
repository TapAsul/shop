import re, math

SRC = 'tapasul-site/assets/logo-frog.svg'
s = open(SRC, encoding='utf-8').read()
path = re.search(r'<path d="([^"]+)"', s).group(1)

# geometry measured from the user's own card artwork (card-front.jpg)
# -> mapped into the logo's viewBox units
CX, CY = 1226.0, -76.0
RADII = [591.0, 428.0, 273.0]
SW    = 85.4          # stroke width
ALPHA = math.radians(41.5)   # half-angle from vertical
sa, ca = math.sin(ALPHA), math.cos(ALPHA)

arcs = []
for R in RADII:
    dx, dy = R*sa, -R*ca
    arcs.append('<path d="M%.1f %.1f A%.1f %.1f 0 0 1 %.1f %.1f"/>' % (
        CX-dx, CY+dy, R, R, CX+dx, CY+dy))

def build(color, viewbox, arcs_color=None):
    ac = arcs_color or color
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s" fill="none" role="img" '
      'aria-label="TapAsul frog logo">\n'
      '  <g transform="translate(0,1436) scale(0.1,-0.1)" fill="%s" fill-rule="evenodd">\n'
      '    <path d="%s"/>\n'
      '  </g>\n'
      '  <g stroke="%s" stroke-width="%.1f" stroke-linecap="round" fill="none">\n'
      '    %s\n'
      '  </g>\n'
      '</svg>\n'
    ) % (viewbox, color, path, ac, SW, '\n    '.join(arcs))

VB_MAIN = "20 -690 1640 2140"
VB_FAV  = "20 -690 1640 2140"

open('tapasul-site/assets/logo-frog.svg','w',encoding='utf-8').write(build('#0881EF', VB_MAIN))
open('tapasul-site/assets/logo-frog-white.svg','w',encoding='utf-8').write(build('#FFFFFF', VB_MAIN))
open('tapasul-site/favicon.svg','w',encoding='utf-8').write(build('#0881EF', VB_FAV))
print('written')
