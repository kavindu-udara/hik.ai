```bash
# 1. Make sure everything is committed
git add .
git commit -m "chore: prepare obsidian plugin v1.0.0"

# 2. Create a specific tag for the plugin
git tag plugin-v1.0.0

# 3. Push the tag to GitHub (this triggers the workflow!)
git push origin plugin-v1.0.0

```
