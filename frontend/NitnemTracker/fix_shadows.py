import re
import os

filepath = r'c:\right\ANHAD\frontend\NitnemTracker\nitnem-tracker-fixes.css'
with open(filepath, 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Update the design tokens to be incredibly subtle like trendora-premium
css = re.sub(r'--clay-shadow-deep: [\d.]+;', '--clay-shadow-deep: 0.06;', css)
css = re.sub(r'--clay-shadow-mid: [\d.]+;', '--clay-shadow-mid: 0.04;', css)
css = re.sub(r'--clay-shadow-soft: [\d.]+;', '--clay-shadow-soft: 0.02;', css)
css = re.sub(r'--clay-inset-shadow: [\d.]+;', '--clay-inset-shadow: 0.03;', css)

# In dark mode
# Note: Replaces the specific block
dark_mode_tokens = """    --clay-shadow-deep: 0.35;
    --clay-shadow-mid: 0.25;
    --clay-shadow-soft: 0.15;
    --clay-highlight: 0.03;
    --clay-border-glow: 0.08;
    --clay-inset-shadow: 0.15;"""
css = re.sub(
    r'--clay-shadow-deep: 0\.25;.*?--clay-inset-shadow: 0\.22;', 
    dark_mode_tokens, 
    css, 
    flags=re.DOTALL
)

# 2. Replace the massive muddy 35px blobs with crisp 16px/12px/8px shadows

# .card base
card_shadow_replacement = """        16px 16px 32px rgba(0,0,0, var(--clay-shadow-deep)),
        -16px -16px 32px rgba(255,255,255, var(--clay-highlight)),
        inset 8px 8px 16px rgba(255,255,255,1),
        inset -8px -8px 16px rgba(0,0,0, var(--clay-inset-shadow)),
        0 0 0 1px rgba(255,255,255, var(--clay-border-glow)) !important;"""
css = re.sub(
    r'35px 35px 80px rgba\(0,0,0, var\(--clay-shadow-deep\)\),.*?inset 0 -2px 5px rgba\(0,0,0, var\(--clay-inset-shadow\)\) !important;',
    card_shadow_replacement,
    css,
    flags=re.DOTALL
)

# .status-pill
css = re.sub(
    r'8px 8px 20px rgba\(0,0,0,0\.25\),.*?inset 0 -1px 2px rgba\(0,0,0,0\.05\) !important;',
    '8px 8px 16px rgba(0,0,0,0.06),\n        -8px -8px 16px rgba(255,255,255,0.90),\n        inset 4px 4px 8px rgba(255,255,255,1),\n        inset -4px -4px 8px rgba(0,0,0,0.03) !important;',
    css,
    flags=re.DOTALL
)
css = re.sub(
    r'8px 8px 20px rgba\(0,0,0,0\.50\),.*?inset 0 -1px 2px rgba\(0,0,0,0\.20\) !important;',
    '8px 8px 16px rgba(0,0,0,0.35),\n        -8px -8px 16px rgba(255,255,255,0.04),\n        inset 4px 4px 8px rgba(255,255,255,0.08),\n        inset -4px -4px 8px rgba(0,0,0,0.15) !important;',
    css,
    flags=re.DOTALL
)

# .header-btn
css = re.sub(
    r'6px 6px 16px rgba\(0,0,0,0\.22\),.*?inset 0 1px 3px rgba\(255,255,255,1\) !important;',
    '6px 6px 12px rgba(0,0,0,0.06),\n        -6px -6px 12px rgba(255,255,255,0.90),\n        inset 2px 2px 4px rgba(255,255,255,1),\n        inset -2px -2px 4px rgba(0,0,0,0.03) !important;',
    css,
    flags=re.DOTALL
)
css = re.sub(
    r'6px 6px 16px rgba\(0,0,0,0\.50\),.*?inset 0 1px 3px rgba\(255,255,255,0\.08\) !important;',
    '6px 6px 12px rgba(0,0,0,0.30),\n        -6px -6px 12px rgba(255,255,255,0.04),\n        inset 2px 2px 4px rgba(255,255,255,0.06),\n        inset -2px -2px 4px rgba(0,0,0,0.15) !important;',
    css,
    flags=re.DOTALL
)

# .card:hover
css = re.sub(
    r'40px 40px 100px rgba\(0,0,0, calc\(var\(--clay-shadow-deep\) \+ 0\.05\)\),.*?inset 0 -2px 5px rgba\(0,0,0, var\(--clay-inset-shadow\)\) !important;',
    '20px 20px 40px rgba(0,0,0, var(--clay-shadow-deep)),\n        -20px -20px 40px rgba(255,255,255, var(--clay-highlight)),\n        inset 10px 10px 20px rgba(255,255,255,1),\n        inset -10px -10px 20px rgba(0,0,0, var(--clay-inset-shadow)),\n        0 0 0 1px rgba(255,255,255, var(--clay-border-glow)) !important;',
    css,
    flags=re.DOTALL
)

# .card:active
css = re.sub(
    r'inset 12px 12px 35px rgba\(0,0,0,0\.30\),.*?6px 6px 20px rgba\(0,0,0,0\.20\) !important;',
    'inset 8px 8px 16px rgba(0,0,0, var(--clay-shadow-mid)),\n        inset -8px -8px 16px rgba(255,255,255, var(--clay-highlight)),\n        0 0 0 1px rgba(255,255,255, var(--clay-border-glow)) !important;',
    css,
    flags=re.DOTALL
)

# .card-icon
css = re.sub(
    r'6px 6px 16px rgba\(0,0,0,0\.18\),.*?inset 0 2px 4px rgba\(255,255,255,0\.9\) !important;',
    '6px 6px 12px rgba(0,0,0,0.06),\n        -6px -6px 12px rgba(255,255,255,0.85),\n        inset 2px 2px 5px rgba(255,255,255,0.9),\n        inset -2px -2px 5px rgba(0,0,0,0.03) !important;',
    css,
    flags=re.DOTALL
)

css = re.sub(
    r'6px 6px 16px rgba\(0,0,0,0\.45\),.*?inset 0 2px 4px rgba\(255,255,255,0\.06\) !important;',
    '6px 6px 12px rgba(0,0,0,0.35),\n        -6px -6px 12px rgba(255,255,255,0.04),\n        inset 2px 2px 5px rgba(255,255,255,0.06),\n        inset -2px -2px 5px rgba(0,0,0,0.15) !important;',
    css,
    flags=re.DOTALL
)

# .present-btn
css = re.sub(
    r'12px 12px 32px rgba\(var\(--clay-orange-rgb\),0\.45\),.*?inset 0 2px 5px rgba\(255,255,255,0\.8\) !important;',
    '8px 8px 16px rgba(var(--clay-orange-rgb),0.15),\n        -8px -8px 16px rgba(255,255,255,0.80),\n        inset 4px 4px 8px rgba(255,255,255,0.8),\n        inset -4px -4px 8px rgba(0,0,0,0.03) !important;',
    css,
    flags=re.DOTALL
)

# .present-btn.marked
css = re.sub(
    r'12px 12px 32px rgba\(var\(--clay-green-rgb\),0\.45\),.*?inset 0 2px 5px rgba\(255,255,255,0\.8\) !important;',
    '8px 8px 16px rgba(var(--clay-green-rgb),0.15),\n        -8px -8px 16px rgba(255,255,255,0.80),\n        inset 4px 4px 8px rgba(255,255,255,0.8),\n        inset -4px -4px 8px rgba(0,0,0,0.03) !important;',
    css,
    flags=re.DOTALL
)

# .complete-all-btn, .add-bani-btn etc
css = re.sub(
    r'8px 8px 22px rgba\(0,0,0,0\.22\),.*?inset 0 2px 4px rgba\(255,255,255,1\) !important;',
    '8px 8px 16px rgba(0,0,0,0.06),\n        -8px -8px 16px rgba(255,255,255,0.85),\n        inset 4px 4px 8px rgba(255,255,255,1),\n        inset -4px -4px 8px rgba(0,0,0,0.03) !important;',
    css,
    flags=re.DOTALL
)

# dark mode btn
css = re.sub(
    r'8px 8px 22px rgba\(0,0,0,0\.50\),.*?inset 0 2px 4px rgba\(255,255,255,0\.06\) !important;',
    '8px 8px 16px rgba(0,0,0,0.30),\n        -8px -8px 16px rgba(255,255,255,0.04),\n        inset 4px 4px 8px rgba(255,255,255,0.06),\n        inset -4px -4px 8px rgba(0,0,0,0.15) !important;',
    css,
    flags=re.DOTALL
)

# .bani-item
css = re.sub(
    r'6px 6px 16px rgba\(0,0,0,0\.12\),.*?inset 0 1px 3px rgba\(255,255,255,0\.9\) !important;',
    '6px 6px 12px rgba(0,0,0,0.05),\n        -6px -6px 12px rgba(255,255,255,0.80),\n        inset 2px 2px 4px rgba(255,255,255,0.9),\n        inset -2px -2px 4px rgba(0,0,0,0.02) !important;',
    css,
    flags=re.DOTALL
)

css = re.sub(
    r'6px 6px 16px rgba\(0,0,0,0\.40\),.*?inset 0 1px 3px rgba\(255,255,255,0\.05\) !important;',
    '6px 6px 12px rgba(0,0,0,0.25),\n        -6px -6px 12px rgba(255,255,255,0.03),\n        inset 2px 2px 4px rgba(255,255,255,0.05),\n        inset -2px -2px 4px rgba(0,0,0,0.12) !important;',
    css,
    flags=re.DOTALL
)

# .mala-center-btn
css = re.sub(
    r'12px 12px 32px rgba\(0,0,0,0\.28\),.*?inset 0 -2px 4px rgba\(0,0,0,0\.06\) !important;',
    '12px 12px 24px rgba(0,0,0,0.08),\n        -12px -12px 24px rgba(255,255,255,0.90),\n        inset 6px 6px 12px rgba(255,255,255,1),\n        inset -6px -6px 12px rgba(0,0,0,0.04) !important;',
    css,
    flags=re.DOTALL
)

css = re.sub(
    r'12px 12px 32px rgba\(0,0,0,0\.55\),.*?inset 0 -2px 4px rgba\(0,0,0,0\.20\) !important;',
    '12px 12px 24px rgba(0,0,0,0.30),\n        -12px -12px 24px rgba(255,255,255,0.05),\n        inset 6px 6px 12px rgba(255,255,255,0.08),\n        inset -6px -6px 12px rgba(0,0,0,0.15) !important;',
    css,
    flags=re.DOTALL
)

# .tab-bar-blur
css = re.sub(
    r'0 -20px 60px rgba\(0,0,0,0\.22\),.*?inset 0 -1px 2px rgba\(0,0,0,0\.04\) !important;',
    '0 -12px 24px rgba(0,0,0,0.05),\n        0 12px 24px rgba(255,255,255,0.95),\n        inset 4px 4px 12px rgba(255,255,255,0.95),\n        inset -4px -4px 12px rgba(0,0,0,0.03) !important;',
    css,
    flags=re.DOTALL
)

css = re.sub(
    r'0 -20px 60px rgba\(0,0,0,0\.45\),.*?inset 0 -1px 2px rgba\(0,0,0,0\.15\) !important;',
    '0 -12px 24px rgba(0,0,0,0.25),\n        0 12px 24px rgba(255,255,255,0.03),\n        inset 4px 4px 12px rgba(255,255,255,0.08),\n        inset -4px -4px 12px rgba(0,0,0,0.10) !important;',
    css,
    flags=re.DOTALL
)

# modal
css = re.sub(
    r'0 -25px 65px rgba\(0,0,0,0\.30\),.*?inset 0 -2px 5px rgba\(0,0,0,0\.04\) !important;',
    '0 -16px 32px rgba(0,0,0,0.06),\n        0 8px 24px rgba(255,255,255,0.95),\n        inset 4px 4px 12px rgba(255,255,255,0.95),\n        inset -4px -4px 12px rgba(0,0,0,0.03) !important;',
    css,
    flags=re.DOTALL
)

css = re.sub(
    r'0 -25px 65px rgba\(0,0,0,0\.55\),.*?inset 0 -2px 5px rgba\(0,0,0,0\.20\) !important;',
    '0 -16px 32px rgba(0,0,0,0.35),\n        0 8px 24px rgba(255,255,255,0.05),\n        inset 4px 4px 12px rgba(255,255,255,0.08),\n        inset -4px -4px 12px rgba(0,0,0,0.15) !important;',
    css,
    flags=re.DOTALL
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(css)

print("Shadows replaced successfully")
