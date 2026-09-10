"""Regression: nested layouts need translations even when pages do not import them."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import generate_route_namespaces as generator


class LayoutNamespacesTest(unittest.TestCase):
    def test_quote_styles_reexports_dynamic_imports_and_inherited_client_boundary(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            files = {
                'app/page.tsx': 'import Wrapper from "@/components/Wrapper"; import Client from "@/components/Client";',
                'components/Wrapper.tsx': 'export { default } from "./Nested";',
                'components/Nested.tsx': "'use client'; useTranslations('singleQuoted');",
                'components/Client.tsx': '"use client"; import Child from "./Child"; const Lazy = import("./Lazy"); useTranslations("doubleQuoted");',
                'components/Child.tsx': 'useTranslations("inheritedBoundary");',
                'components/Lazy.tsx': 'useTranslations("lazyBoundary");',
                'components/Unrelated.tsx': '"use client"; useTranslations("unrelated");',
            }
            for name, text in files.items():
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(text, encoding='utf-8')
            with patch.object(generator, 'APP', root / 'app'), patch.object(generator, 'SRC', root):
                self.assertEqual(generator.namespaces_for_page(root / 'app/page.tsx', set()), {'singleQuoted', 'doubleQuoted', 'inheritedBoundary', 'lazyBoundary'})

    def test_shared_dependency_revisited_under_a_client_boundary(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'server.tsx').write_text('import Shared from "./shared";', encoding='utf-8')
            (root / 'client.tsx').write_text("'use client'; import Shared from './shared';", encoding='utf-8')
            (root / 'shared.tsx').write_text("useTranslations('clientDependency');", encoding='utf-8')
            visited = set()
            self.assertEqual(generator.collect_ns_from_subtree(root / 'server.tsx', visited), set())
            self.assertEqual(generator.collect_ns_from_subtree(root / 'client.tsx', visited), {'clientDependency'})

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
