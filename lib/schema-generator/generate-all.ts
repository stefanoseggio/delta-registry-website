import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ACTOR_REGISTRY } from './actor-registry';
import { resolveActorSchema } from './read-actor-schema';
import { toOpenAIChatCompletionsTool, toOpenAIResponsesTool } from './openai-adapter';
import { toAnthropicTool } from './anthropic-adapter';
import { toGeminiFunctionDeclaration } from './gemini-adapter';
import { toOpenAPISpec, decideOpenAPIPattern } from './openapi-adapter';
import { toLangChainPython, toLangChainTypeScript } from './langchain-adapter';
import { toLlamaIndexPython } from './llamaindex-adapter';
import { toCrewAIPython, toAG2Python } from './crewai-ag2-adapter';

// Overridable because this driver is compiled to a scratch directory for execution (the project's
// own tsconfig is noEmit + bundler-resolution, meant for Next.js, not standalone `node` execution)
// — __dirname-relative math would resolve against that scratch location otherwise.
const OUT_DIR = process.env.APIFY_SCHEMA_OUT_DIR ?? join(__dirname, '..', '..', 'public', 'schemas');

interface IndexEntry {
  slug: string;
  title: string;
  inputSchemaSource: string;
  datasetSchemaSource: string;
  openapiPattern: 'sync' | 'async';
  openapiPatternReason: string;
  formats: string[];
}

async function main() {
  const failures: Array<{ slug: string; error: string }> = [];
  const index: IndexEntry[] = [];

  for (const meta of ACTOR_REGISTRY) {
    process.stdout.write(`[${meta.slug}] resolving schema... `);
    try {
      const resolved = await resolveActorSchema(meta);
      process.stdout.write(`ok (${resolved.inputSchemaSource})\n`);

      const dir = join(OUT_DIR, meta.slug);
      mkdirSync(dir, { recursive: true });

      const decision = decideOpenAPIPattern(meta.maxObservedRuntimeSecs);

      const files: Record<string, string> = {
        'openai-chat-completions.json': JSON.stringify(toOpenAIChatCompletionsTool(resolved), null, 2),
        'openai-responses.json': JSON.stringify(toOpenAIResponsesTool(resolved), null, 2),
        'anthropic.json': JSON.stringify(toAnthropicTool(resolved), null, 2),
        'gemini.json': JSON.stringify(toGeminiFunctionDeclaration(resolved), null, 2),
        'openapi.json': JSON.stringify(toOpenAPISpec(resolved), null, 2),
        'langchain_tool.py': toLangChainPython(resolved),
        'langchain_tool.ts': toLangChainTypeScript(resolved),
        'llamaindex_tool.py': toLlamaIndexPython(resolved),
        'crewai_tool.py': toCrewAIPython(resolved),
        'ag2_tool.py': toAG2Python(resolved),
      };

      for (const [name, content] of Object.entries(files)) {
        writeFileSync(join(dir, name), content, 'utf-8');
      }

      index.push({
        slug: meta.slug,
        title: resolved.title,
        inputSchemaSource: resolved.inputSchemaSource,
        datasetSchemaSource: resolved.datasetSchemaSource,
        openapiPattern: decision.useAsync ? 'async' : 'sync',
        openapiPatternReason: decision.reason,
        formats: Object.keys(files),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      process.stdout.write(`FAILED: ${message}\n`);
      failures.push({ slug: meta.slug, error: message });
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    join(OUT_DIR, 'index.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalActors: ACTOR_REGISTRY.length,
        succeeded: index.length,
        failed: failures.length,
        actors: index,
        failures,
      },
      null,
      2,
    ),
    'utf-8',
  );

  console.log(`\n=== Summary ===`);
  console.log(`  succeeded: ${index.length}/${ACTOR_REGISTRY.length}`);
  console.log(`  failed: ${failures.length}`);
  for (const f of failures) console.log(`    - ${f.slug}: ${f.error}`);

  if (failures.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('generate-all.ts crashed:', err);
  process.exitCode = 1;
});
