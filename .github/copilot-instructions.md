# Glitch Text Effect CSS Repository

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Repository Overview
This repository contains a CSS-only implementation of an animated glitch text effect with red and blue shadow offsets. The main styling code is stored in `README.md` and demonstrates advanced CSS keyframe animations for creating digital glitch effects.

## Working Effectively

### Repository Structure
- `README.md` - Contains the complete CSS code for the glitch text effect
- `.github/` - GitHub configuration directory (contains these instructions)
- No build system, dependencies, or complex project structure required

### Setting Up Development Environment
```bash
# Clone and navigate to repository
cd /path/to/gollilasoilver

# View the main CSS code
cat README.md
```

### Testing the CSS Effect
**CRITICAL**: Always validate CSS changes by creating a test HTML file and viewing in browser.

Create test HTML file (takes < 30 seconds):
```bash
# Create test file in temporary directory
cat > /tmp/glitch-test.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Glitch Text Effect Test</title>
    <style>
        /* Paste CSS content from README.md here */
    </style>
</head>
<body>
    <div class="content">
        <div class="text" data-text="GLITCH">GLITCH</div>
    </div>
</body>
</html>
EOF
```

Start local HTTP server (takes < 5 seconds):
```bash
cd /tmp
python3 -m http.server 8080 &
```

### Validation Requirements
**MANDATORY**: After making any changes to the CSS in README.md:

1. **Copy CSS to test file**: Update the `<style>` section in your test HTML with the modified CSS
2. **Visual validation**: Open `http://localhost:8080/glitch-test.html` in browser
3. **Verify glitch effect**: Confirm the text displays with:
   - White main text
   - Red shadow offset to the right
   - Blue shadow offset to the left
   - Continuous glitch animation with clipping effects
   - Black background
   - Poppins font family (may fallback due to font loading restrictions)

### Expected Behavior
The glitch effect should show:
- Large white "GLITCH" text in center of black screen
- Continuous animation creating digital distortion effects
- Red and blue color separation creating 3D glitch appearance
- Smooth 2-second animation loops

### Common Development Tasks

#### Modifying Animation Timing
- Animation duration controlled by: `animation: glitch-1 2s linear infinite reverse`
- Modify the `2s` value to change speed
- ALWAYS test changes visually after modification

#### Adjusting Glitch Intensity
- Color offset distance controlled by `left: 3px` and `left: -3px` values
- Shadow colors controlled by `text-shadow: -2px 0 red` and `text-shadow: -2px 0 blue`
- Clip rectangles in keyframes control glitch pattern intensity

#### Testing Text Content
- Change the text by modifying both `data-text="GLITCH"` and `GLITCH` in the HTML content
- Both values must match for proper effect rendering

### Performance Considerations
- CSS animations are GPU-accelerated and should run smoothly
- No JavaScript dependencies or external resources required
- Font loading from Google Fonts may be blocked in some environments (fallback fonts work)

### Validation Checklist
Before committing changes, ALWAYS verify:
- [ ] CSS syntax is valid (no parse errors)
- [ ] Test HTML file loads without errors
- [ ] Glitch animation plays continuously
- [ ] Red and blue offsets are visible
- [ ] Text remains readable despite glitch effects
- [ ] Background remains black
- [ ] Animation loops smoothly without gaps

### Troubleshooting

#### Animation Not Working
- Check CSS keyframe syntax for `glitch-1` and `glitch-2`
- Verify animation property includes `infinite` and duration
- Ensure `position: relative` is set on `.text` element

#### Colors Not Showing
- Verify `text-shadow` properties are correctly set
- Check `::before` and `::after` pseudo-elements have correct positioning
- Confirm `content: attr(data-text)` matches HTML data attribute

#### Font Issues
- Google Fonts may be blocked - this is expected behavior
- Fallback to system fonts is normal and acceptable
- Effect works with any font family

### Repository Maintenance
This repository requires no build process, dependency management, or CI/CD pipeline. Changes are immediately effective when CSS is updated in README.md.

**Time Expectations**:
- CSS modification: < 2 minutes
- Visual validation: < 1 minute  
- Complete change cycle: < 5 minutes total

**NEVER CANCEL**: While operations are fast, always wait for browser to fully load and render animation before concluding validation.