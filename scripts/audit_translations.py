import re

with open('mobile-app/constants/i18n.ts', 'r', encoding='utf-8') as f:
    content = f.read()

en_match = re.search(r'const englishAppText:\s*Record<AppTextKey,\s*string>\s*=\s*\{([\s\S]*?)\n\};', content)
en_keys = set(re.findall(r'^\s*([a-zA-Z0-9_]+):', en_match.group(1), re.MULTILINE))
print(f"Total English keys: {len(en_keys)}")

reg_start = content.find('const regionalAppText:')
reg_content = content[reg_start:]

langs = ['hi', 'kn', 'ta', 'te', 'ml', 'mr', 'bh', 'bho']
all_pass = True
for l in langs:
    m = re.search(rf'^\s*{l}:\s*\{{([\s\S]*?)\n\s*\}}', reg_content, re.MULTILINE)
    if not m:
        print(f"FAILED to find block for {l}")
        all_pass = False
        continue
    l_keys = set(re.findall(r'^\s*([a-zA-Z0-9_]+):', m.group(1), re.MULTILINE))
    missing = en_keys - l_keys
    print(f"Language '{l}': {len(l_keys)}/{len(en_keys)} present. Missing: {len(missing)}")
    if missing:
        all_pass = False
        print(f"   Missing ({len(missing)}): {sorted(list(missing))}")

if all_pass:
    print("\nSUCCESS: All 8 regional languages have 100% translation coverage with 0 missing keys!")
else:
    print("\nFAILURE: Some translations are missing.")
