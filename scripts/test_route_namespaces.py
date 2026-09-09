"""Regression: nested layouts need translations even when pages do not import them."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import generate_route_namespaces as generator


class LayoutNamespacesTest(unittest.TestCase):
    def test_layout_imports_are_inherited_without_sibling_namespaces(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            files = {
                "app/layout.tsx": 'import Root from "@/components/Root";',
                "components/Root.tsx": '"use client"; useTranslations("rootMenu");',
                "app/pms/layout.tsx": '"use client"; useTranslations("pms.common");',
                "app/pms/[id]/layout.tsx": 'import Menu from "@/components/Menu";',
                "components/Menu.tsx": '"use client"; useTranslations("pmsJournal");',
                "app/pms/[id]/reports/page.tsx": '"use client"; useTranslations("report");',
                "app/other/layout.tsx": '"use client"; useTranslations("unrelated");',
            }
            for name, text in files.items():
                p = root / name
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(text, encoding="utf-8")
            with patch.object(generator, "APP", root / "app"), patch.object(generator, "SRC", root):
                self.assertEqual(generator.namespaces_for_page(root / "app/pms/[id]/reports/page.tsx", {"common"}), {"common", "rootMenu", "pms", "pmsJournal", "report"})


if __name__ == "__main__":
    unittest.main()
