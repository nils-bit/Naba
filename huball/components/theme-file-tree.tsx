import type { ThemeSummary } from '@/lib/types';

interface Props {
  summary: ThemeSummary;
}

export function ThemeFileTree({ summary }: Props) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Generated Theme
      </h3>
      <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 font-mono text-sm text-zinc-300">
        <TreeNode name={summary.themeName} isDir>
          <TreeNode name="theme.json" />
          <TreeNode name="fields.json" />
          <TreeNode name="css" isDir>
            <TreeNode name="main.css" />
          </TreeNode>
          <TreeNode name="js" isDir>
            <TreeNode name="main.js" />
          </TreeNode>
          <TreeNode name="modules" isDir>
            {summary.moduleNames.map((name, i) => (
              <TreeNode key={i} name={`${name.toLowerCase().replace(/\s+/g, '-')}.module`} isDir>
                <TreeNode name="meta.json" />
                <TreeNode name="fields.json" />
                <TreeNode name="module.html" />
                <TreeNode name="module.css" />
              </TreeNode>
            ))}
          </TreeNode>
          <TreeNode name="templates" isDir>
            <TreeNode name="home.html" />
          </TreeNode>
        </TreeNode>
      </div>
    </div>
  );
}

function TreeNode({
  name,
  isDir,
  children,
}: {
  name: string;
  isDir?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="pl-4">
      <div className="flex items-center gap-1.5 py-0.5">
        <span className={isDir ? 'text-orange-400' : 'text-zinc-500'}>
          {isDir ? '\u25B8' : '\u00B7'}
        </span>
        <span className={isDir ? 'text-orange-400' : ''}>{name}</span>
      </div>
      {children}
    </div>
  );
}
