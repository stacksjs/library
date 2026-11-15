// The Notes app icon: a deep blue squircle holding a sheet of paper with a
// turned corner, a ticked to-do on its first line and plain lines of writing
// below. Drawn with CoreGraphics so the 1024 pixel master is made by
// a script and can be changed by editing numbers, not a design file.
//
//   swift scripts/make-app-icon.swift resources/native/icon/AppIcon-1024.png
import AppKit

let size: CGFloat = 1024
let output = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "AppIcon-1024.png"
let space = CGColorSpace(name: CGColorSpace.sRGB)!
guard let context = CGContext(data: nil, width: Int(size), height: Int(size), bitsPerComponent: 8, bytesPerRow: 0, space: space, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { fatalError("no context") }

func color(_ hex: UInt32, _ alpha: CGFloat = 1) -> CGColor {
    CGColor(colorSpace: space, components: [CGFloat((hex >> 16) & 255) / 255, CGFloat((hex >> 8) & 255) / 255, CGFloat(hex & 255) / 255, alpha])!
}

// macOS icons keep a margin inside the canvas: the squircle is 824 points.
let tile = CGRect(x: 100, y: 100, width: 824, height: 824)
let radius: CGFloat = 186
let tilePath = CGPath(roundedRect: tile, cornerWidth: radius, cornerHeight: radius, transform: nil)

// Soft drop shadow under the tile.
context.saveGState()
context.setShadow(offset: CGSize(width: 0, height: -14), blur: 28, color: color(0x000000, 0.28))
context.addPath(tilePath); context.setFillColor(color(0x1b2a6b)); context.fillPath()
context.restoreGState()

// Tile gradient, light at the top.
context.saveGState()
context.addPath(tilePath); context.clip()
let gradient = CGGradient(colorsSpace: space, colors: [color(0x4f6df0), color(0x24349a), color(0x172266)] as CFArray, locations: [0, 0.55, 1])!
context.drawLinearGradient(gradient, start: CGPoint(x: 512, y: 924), end: CGPoint(x: 512, y: 100), options: [])
// A faint highlight along the upper edge.
let sheen = CGGradient(colorsSpace: space, colors: [color(0xffffff, 0.22), color(0xffffff, 0)] as CFArray, locations: [0, 1])!
context.drawLinearGradient(sheen, start: CGPoint(x: 512, y: 924), end: CGPoint(x: 512, y: 640), options: [])
context.restoreGState()

// The sheet: white paper, a little taller than wide, with its top right corner turned down.
let sheet = CGRect(x: 276, y: 232, width: 472, height: 560)
let fold: CGFloat = 132
let corner: CGFloat = 44
let paper = CGMutablePath()
paper.move(to: CGPoint(x: sheet.minX + corner, y: sheet.minY))
paper.addLine(to: CGPoint(x: sheet.maxX - corner, y: sheet.minY))
paper.addArc(tangent1End: CGPoint(x: sheet.maxX, y: sheet.minY), tangent2End: CGPoint(x: sheet.maxX, y: sheet.minY + corner), radius: corner)
paper.addLine(to: CGPoint(x: sheet.maxX, y: sheet.maxY - fold))
paper.addLine(to: CGPoint(x: sheet.maxX - fold, y: sheet.maxY))
paper.addLine(to: CGPoint(x: sheet.minX + corner, y: sheet.maxY))
paper.addArc(tangent1End: CGPoint(x: sheet.minX, y: sheet.maxY), tangent2End: CGPoint(x: sheet.minX, y: sheet.maxY - corner), radius: corner)
paper.addLine(to: CGPoint(x: sheet.minX, y: sheet.minY + corner))
paper.addArc(tangent1End: CGPoint(x: sheet.minX, y: sheet.minY), tangent2End: CGPoint(x: sheet.minX + corner, y: sheet.minY), radius: corner)
paper.closeSubpath()

context.saveGState()
context.setShadow(offset: CGSize(width: 0, height: -18), blur: 36, color: color(0x0b1240, 0.42))
context.addPath(paper); context.setFillColor(color(0xffffff)); context.fillPath()
context.restoreGState()

// A hint of shading down the page, so it reads as paper and not a cut-out.
context.saveGState()
context.addPath(paper); context.clip()
let page = CGGradient(colorsSpace: space, colors: [color(0xffffff), color(0xe9eeff)] as CFArray, locations: [0, 1])!
context.drawLinearGradient(page, start: CGPoint(x: 512, y: sheet.maxY), end: CGPoint(x: 512, y: sheet.minY), options: [])
context.restoreGState()

// The turned corner: the back of the page, a shade darker, with a rounded tip.
let flap = CGMutablePath()
flap.move(to: CGPoint(x: sheet.maxX - fold, y: sheet.maxY))
flap.addLine(to: CGPoint(x: sheet.maxX - fold, y: sheet.maxY - fold + 30))
flap.addArc(tangent1End: CGPoint(x: sheet.maxX - fold, y: sheet.maxY - fold), tangent2End: CGPoint(x: sheet.maxX - fold + 30, y: sheet.maxY - fold), radius: 30)
flap.addLine(to: CGPoint(x: sheet.maxX, y: sheet.maxY - fold))
flap.closeSubpath()
context.saveGState()
context.setShadow(offset: CGSize(width: -6, height: -8), blur: 16, color: color(0x0b1240, 0.22))
context.addPath(flap); context.setFillColor(color(0xc3cfff)); context.fillPath()
context.restoreGState()

// First line: a ticked to-do. A filled circle in the tile's blue with a white check.
let tick = CGRect(x: 332, y: 604, width: 84, height: 84)
context.addEllipse(in: tick); context.setFillColor(color(0x3a57e8)); context.fillPath()
context.setStrokeColor(color(0xffffff)); context.setLineWidth(13); context.setLineCap(.round); context.setLineJoin(.round)
context.move(to: CGPoint(x: tick.minX + 23, y: tick.midY - 1))
context.addLine(to: CGPoint(x: tick.minX + 37, y: tick.midY - 15))
context.addLine(to: CGPoint(x: tick.minX + 62, y: tick.midY + 14))
context.strokePath()

// Writing: the title beside the tick, then three lines of body, the last one short.
func line(_ x: CGFloat, _ y: CGFloat, _ width: CGFloat, _ height: CGFloat, _ fill: CGColor) {
    context.addPath(CGPath(roundedRect: CGRect(x: x, y: y, width: width, height: height), cornerWidth: height / 2, cornerHeight: height / 2, transform: nil))
    context.setFillColor(fill); context.fillPath()
}
line(446, 632, 156, 28, color(0x1c2a78))
line(332, 508, 360, 22, color(0x1c2a78, 0.30))
line(332, 432, 360, 22, color(0x1c2a78, 0.30))
line(332, 356, 216, 22, color(0x1c2a78, 0.30))

guard let image = context.makeImage() else { fatalError("no image") }
let rep = NSBitmapImageRep(cgImage: image)
guard let data = rep.representation(using: .png, properties: [:]) else { fatalError("no png") }
try data.write(to: URL(fileURLWithPath: output))
print("wrote \(output)")
