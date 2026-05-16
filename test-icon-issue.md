Issue 1: Linux Icon Missing
Linux `.desktop` standard requires valid file extensions or specific MIME responses. By adding `.png` to the PWA manifest URLs, Linux desktop application managers will accurately fetch and display the icons.

Issue 2: Brave Icon Black
Brave handles transparent images in PWAs sometimes strictly on Android depending on the launcher. If an icon is mainly transparency, it can flatten to black. Solution: Always use a solid background (e.g., `#ffffff`) which matches the PWA `background_color`, ensuring a clean look. 

Issue 3: Chrome vs Brave Splash Screen
Padding should be adjusted. Maskable requires strict 20-30% padding. Standard "any" icon shouldn't be overly cramped or too tiny. 
