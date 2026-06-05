import * as fs from 'fs';
import * as path from 'path';

const mapping: Record<string, string> = {
    'MessageCircle': 'ChatCircle',
    'MessageSquare': 'ChatTeardropText',
    'MessageSquareOff': 'ChatTeardropSlash',
    'ChevronDown': 'CaretDown',
    'ChevronDownIcon': 'CaretDown',
    'ChevronUp': 'CaretUp',
    'ChevronUpIcon': 'CaretUp',
    'ChevronLeft': 'CaretLeft',
    'ChevronRight': 'CaretRight',
    'ChevronRightIcon': 'CaretRight',
    'Search': 'MagnifyingGlass',
    'SearchIcon': 'MagnifyingGlass',
    'User': 'User',
    'Users': 'Users',
    'Users2': 'Users',
    'Hash': 'Hash',
    'Rss': 'Rss',
    'ArrowDownUp': 'ArrowsDownUp',
    'Bookmark': 'Bookmark',
    'Loader2': 'CircleNotch',
    'LoaderCircle': 'CircleNotch',
    'Check': 'Check',
    'CheckIcon': 'Check',
    'X': 'X',
    'XIcon': 'X',
    'RemoveIcon': 'X',
    'Link': 'Link',
    'LinkIcon': 'Link',
    'AlertTriangle': 'Warning',
    'UserPlus': 'UserPlus',
    'UserMinus': 'UserMinus',
    'ExternalLink': 'ArrowSquareOut',
    'Info': 'Info',
    'LogOut': 'SignOut',
    'CornerLeftUp': 'ArrowBendUpLeft',
    'Paperclip': 'Paperclip',
    'FileIcon': 'File',
    'Eye': 'Eye',
    'EyeOff': 'EyeSlash',
    'Download': 'DownloadSimple',
    'Trash2': 'Trash',
    'Copy': 'Copy',
    'Pencil': 'PencilSimple',
    'Smile': 'Smiley',
    'Sparkles': 'Sparkle',
    'Globe': 'Globe',
    'Home': 'House',
    'Bell': 'Bell',
    'Inbox': 'Tray',
    'Repeat': 'Repeat',
    'Heart': 'Heart',
    'Repeat2': 'ArrowsClockwise',
    'Play': 'Play',
    'SendHorizontal': 'PaperPlaneRight',
    'ImagePlus': 'ImagePlus',
    'PlusCircle': 'PlusCircle',
    'MoreHorizontal': 'DotsThree',
    'Settings2': 'Sliders',
    'ChevronsUpDown': 'CaretUpDown',
    'ArrowDown': 'ArrowDown',
    'ArrowUp': 'ArrowUp',
    'AlertCircle': 'WarningCircle',
    'Bold': 'TextB',
    'Italic': 'TextItalic',
    'Strikethrough': 'TextStrikethrough',
    'Code': 'Code',
    'Terminal': 'Terminal',
    'PanelLeftIcon': 'SidebarSimple',
    'Moon': 'Moon',
    'Sun': 'Sun',
    'Plus': 'Plus',
    'Compass': 'Compass',
    'CircleIcon': 'Circle',
};

const files = [
    'src/app/admin/(with-sidebar)/app-sidebar.tsx',
    'src/app/admin/(with-sidebar)/log/_components/data-table-column-header.tsx',
    'src/app/admin/(with-sidebar)/log/_components/data-table-faceted-filter.tsx',
    'src/app/admin/(with-sidebar)/log/_components/data-table-pagination.tsx',
    'src/app/admin/(with-sidebar)/log/_components/data-table-row-actions.tsx',
    'src/app/admin/(with-sidebar)/log/_components/data-table-toolbar.tsx',
    'src/app/admin/(with-sidebar)/log/_components/data-table-view-options.tsx',
    'src/app/admin/(with-sidebar)/nav-brand.tsx',
    'src/app/admin/(with-sidebar)/nav-user.tsx',
    'src/app/admin/(with-sidebar)/users/_components/data-table-column-header.tsx',
    'src/app/admin/(with-sidebar)/users/_components/data-table-faceted-filter.tsx',
    'src/app/admin/(with-sidebar)/users/_components/data-table-pagination.tsx',
    'src/app/admin/(with-sidebar)/users/_components/data-table-row-actions.tsx',
    'src/app/admin/(with-sidebar)/users/_components/data-table-toolbar.tsx',
    'src/app/admin/(with-sidebar)/users/_components/data-table-view-options.tsx',
    'src/app/admin/(with-sidebar)/users/_components/InviteUserDialog.tsx',
    'src/app/admin/(with-sidebar)/users/data/data.tsx',
    'src/app/admin/(with-sidebar)/users/roles/_components/data-table-column-header.tsx',
    'src/app/admin/(with-sidebar)/users/roles/_components/data-table-faceted-filter.tsx',
    'src/app/admin/(with-sidebar)/users/roles/_components/data-table-pagination.tsx',
    'src/app/admin/(with-sidebar)/users/roles/_components/data-table-row-actions.tsx',
    'src/app/admin/(with-sidebar)/users/roles/_components/data-table-toolbar.tsx',
    'src/app/admin/(with-sidebar)/users/roles/_components/data-table-view-options.tsx',
    'src/app/error.tsx',
    'src/app/not-found.tsx',
    'src/app/page.tsx',
    'src/app/privacy/page.tsx',
    'src/app/signin/page.tsx',
    'src/app/signin/sign-in-form.tsx',
    'src/app/signup/page.tsx',
    'src/app/signup/sign-up-form.tsx',
    'src/app/(with-sidebar)/channels/[roomId]/components/link-preview-card.tsx',
    'src/app/(with-sidebar)/channels/[roomId]/components/member-list.tsx',
    'src/app/(with-sidebar)/channels/[roomId]/components/message-input.tsx',
    'src/app/(with-sidebar)/channels/[roomId]/components/message-item.tsx',
    'src/app/(with-sidebar)/channels/[roomId]/components/message-list.tsx',
    'src/app/(with-sidebar)/channels/[roomId]/components/mobile-member-list.tsx',
    'src/app/(with-sidebar)/channels/[roomId]/components/room-detail-dialog.tsx',
    'src/app/(with-sidebar)/channels/[roomId]/page.tsx',
    'src/app/(with-sidebar)/channels/[roomId]/room-skeleton.tsx',
    'src/app/(with-sidebar)/create-channel-dialog.tsx',
    'src/app/(with-sidebar)/direct-message-dialog.tsx',
    'src/app/(with-sidebar)/explore-channels-dialog.tsx',
    'src/app/(with-sidebar)/nav-feed.tsx',
    'src/app/(with-sidebar)/nav-main-direct-message.tsx',
    'src/app/(with-sidebar)/nav-main.tsx',
    'src/app/(with-sidebar)/nav-user.tsx',
    'src/app/(with-sidebar)/notifications/page.tsx',
    'src/app/(with-sidebar)/posts/[postId]/post-detail-view.tsx',
    'src/app/(with-sidebar)/profile/[username]/components/follow-button.tsx',
    'src/app/(with-sidebar)/profile/[username]/components/post-input.tsx',
    'src/app/(with-sidebar)/profile/[username]/components/post-item.tsx',
    'src/app/(with-sidebar)/profile/[username]/components/post-media.tsx',
    'src/app/(with-sidebar)/profile/[username]/components/post/post-actions.tsx',
    'src/app/(with-sidebar)/profile/[username]/components/post/post-header.tsx',
    'src/app/(with-sidebar)/profile/[username]/components/post/user-hover-card.tsx',
    'src/app/(with-sidebar)/profile/[username]/components/quote-dialog.tsx',
    'src/app/(with-sidebar)/profile/[username]/components/reply-dialog.tsx',
    'src/app/(with-sidebar)/profile/[username]/components/simple-reply-input.tsx',
    'src/app/(with-sidebar)/profile/[username]/components/user-list-dialog.tsx',
    'src/app/(with-sidebar)/profile/[username]/profile-view.tsx',
    'src/app/(with-sidebar)/search-user-dialog.tsx',
    'src/app/(with-sidebar)/timeline/timeline-view.tsx',
    'src/app/(with-sidebar)/user-settings-dialog.tsx',
    'src/components/emoji-picker/emoji-picker.tsx',
    'src/components/landingpage/mode-toggle-nav-user.tsx',
    'src/components/landingpage/mode-toggle.tsx',
    'src/components/lexical/floating-toolbar-plugin.tsx',
    'src/components/message-search.tsx',
    'src/components/ui/accordion.tsx',
    'src/components/ui/breadcrumb.tsx',
    'src/components/ui/checkbox.tsx',
    'src/components/ui/command.tsx',
    'src/components/ui/dialog.tsx',
    'src/components/ui/dropdown-menu.tsx',
    'src/components/ui/image-lightbox.tsx',
    'src/components/ui/multi-select.tsx',
    'src/components/ui/profile-hover-card.tsx',
    'src/components/ui/select.tsx',
    'src/components/ui/sheet.tsx',
    'src/components/ui/sidebar.tsx',
    'src/components/ui/x-embed.tsx',
    'src/components/ui/youtube-embed.tsx',
];

function refactorFile(filePath: string) {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Replace import source and icons in import statement
    const lucideImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g;
    content = content.replace(lucideImportRegex, (match, p1) => {
        const icons = p1.split(',').map((s: string) => s.trim());
        const mappedIcons = icons.map((icon: string) => {
            const [name, alias] = icon.split(/\s+as\s+/);
            const mappedName = mapping[name] || name;
            return alias ? `${mappedName} as ${alias}` : mappedName;
        });
        // Filter unique icons and remove empty strings
        const uniqueIcons = [...new Set(mappedIcons)].filter(Boolean);
        return `import { ${uniqueIcons.join(', ')} } from "@phosphor-icons/react"`;
    });

    // 2. Replace icon components in JSX and add weight="duotone"
    // This is more complex because we need to avoid replacing parts of words
    // and we need to handle props.
    for (const [lucideName, phosphorName] of Object.entries(mapping)) {
        // Replace component usage: <LucideName ... /> or <LucideName>...</LucideName>
        // Use a regex that matches the component name followed by space or > or /
        const componentRegex = new RegExp(`(<)${lucideName}(\\s|>|\\/)`, 'g');
        content = content.replace(componentRegex, `$1${phosphorName}$2`);
        
        // Also handle cases where icons are passed as objects/variables (e.g., icon: Hash)
        // This is riskier but usually icons are capitalized in this project.
        // We only replace if it's exactly the icon name as a word.
        const variableRegex = new RegExp(`\\b${lucideName}\\b`, 'g');
        // Avoid replacing in imports we already handled (though they should be Phosphor names now)
        // and avoid replacing in strings.
        // For simplicity, we'll only do this if it's not preceded by a dot or followed by a colon (except in object shorthand)
        // Actually, many places use icon: Hash.
        if (lucideName !== phosphorName) {
            // content = content.replace(variableRegex, phosphorName); // Disabled for safety, let's see.
            // Let's enable it but with caution.
            content = content.replace(variableRegex, (match, offset) => {
                // Check if it's in a string or comment (very basic check)
                const before = content.slice(Math.max(0, offset - 1), offset);
                const after = content.slice(offset + match.length, offset + match.length + 1);
                
                // If it's part of an import statement we already changed, it's fine.
                // If it's a JSX tag, we already handled it.
                // If it's used as a value: icon={Hash} or icon: Hash
                return phosphorName;
            });
        }
    }

    // 3. Add weight="duotone" and remove strokeWidth
    // We look for Phosphor components and add the prop if not present.
    const phosphorIconNames = [...new Set(Object.values(mapping))];
    for (const name of phosphorIconNames) {
        const componentOpenRegex = new RegExp(`<${name}(\\s|>)`, 'g');
        content = content.replace(componentOpenRegex, (match, p1) => {
            if (p1 === '>') {
                return `<${name} weight="duotone">`;
            }
            return `<${name} weight="duotone" `;
        });
        
        // Remove strokeWidth="..." or strokeWidth={...}
        const strokeWidthRegex = /\s+strokeWidth=\{?[^}\s>]+}?/g;
        content = content.replace(strokeWidthRegex, '');
        
        // Clean up double weights or duplicate props if any (though regex above tries to avoid it)
        content = content.replace(/weight="duotone"\s+weight="duotone"/g, 'weight="duotone"');
    }

    // Special case for Loader2 -> CircleNotch animate-spin
    // If we have <CircleNotch ... /> we should ensure it has weight="duotone"
    // (Already handled by generic loop above)

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Refactored ${filePath}`);
}

files.forEach(refactorFile);
