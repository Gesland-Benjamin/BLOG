#!/bin/bash

# Script pour analyser les classes Bootstrap dans les fichiers EJS

echo "🔍 ANALYSE DES CLASSES BOOTSTRAP DANS LES FICHIERS EJS"
echo "======================================================"
echo ""

# Array of Bootstrap classes to search for
BOOTSTRAP_CLASSES=(
  # Layout
  "row" "col-" "container" "g-[0-5]"
  # Display & Spacing
  "d-flex" "d-none" "d-inline" "d-block"
  "p-[0-5]" "m-[0-5]" "pt-" "pb-" "pl-" "pr-" "px-" "py-"
  "mt-" "mb-" "ml-" "mr-" "mx-" "my-"
  "ms-" "me-" "ps-" "pe-"
  # Flexbox
  "flex-wrap" "flex-column" "justify-content-" "align-items-"
  # Visibility
  "visually-hidden"
  # Text
  "text-" "fw-" "fst-"
  # Background/Border
  "bg-" "border" "rounded"
  # Sizing
  "w-" "h-" "ratio"
)

# Find all EJS files in views directory
echo "📂 Analysant les fichiers EJS dans /views..."
echo ""

# Create a summary of findings
declare -A class_counts
total_classes=0

for file in /Users/ben/Desktop/Ben/PROJET/BLOG/views/**/*.ejs; do
  if [[ -f "$file" ]]; then
    # Skip if file doesn't exist or is a partial
    basename=$(basename "$file")
    
    # Count Bootstrap classes (simplified grep)
    class_count=$(grep -o 'class="[^"]*"' "$file" | wc -l)
    
    if [ $class_count -gt 0 ]; then
      # Count specific Bootstrap patterns
      bootstrap_count=$(grep -oE '(row|col-[a-z]*-?[0-9]|g-[0-9]|d-flex|p-[0-9]|m-[a-z]*-[0-9]|justify-content|align-items|flex-wrap)' "$file" | wc -l)
      
      if [ $bootstrap_count -gt 0 ]; then
        echo "📄 $basename"
        echo "   Total class attributes: $class_count"
        echo "   Bootstrap classes found: $bootstrap_count"
        echo ""
        total_classes=$((total_classes + bootstrap_count))
      fi
    fi
  fi
done

echo "=========================================================="
echo "✅ TOTAL BOOTSTRAP CLASSES FOUND: $total_classes"
echo ""
echo "💡 Prochaine étape: Utiliser 7-pages-*.css pour CSS specifique"
echo "   et supprimer les classes Bootstrap du HTML"
