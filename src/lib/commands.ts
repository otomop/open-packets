/** A bounded teaching matcher, not an IOS or shell interpreter. Nothing is executed. */
export interface CommandSyntax {
  text: string;
  kind: "keyword" | "argument" | "interface";
  meaning?: string;
}

export interface CommandExercise {
  answer: string;
  accept?: readonly string[];
  mode: string;
  task?: string;
  teaching?: { syntax?: readonly CommandSyntax[] };
}

export interface CommandGrade { correct: boolean; feedback: string }
type Platform = "ios" | "windows" | "powershell" | "shell";
type Unit = CommandSyntax & { abbreviated?: boolean };
type Comparison = { correct: boolean; matched: number; reason?: "missing" | "extra" | "different"; unit?: Unit; given?: string };

// Selected keyword prefixes only. Real-device ambiguity depends on its mode,
// image and command tree; contextual ? remains the authority on that device.
const IOS_PREFIXES: Readonly<Record<string, number>> = {
  show: 2, configure: 4, terminal: 4, interface: 3, interfaces: 3,
  "running-config": 3, "startup-config": 5, brief: 2, shutdown: 4, description: 4, enable: 3,
};
const INTERFACES: Readonly<Record<string, string>> = {
  gigabitethernet: "gigabitethernet", gig: "gigabitethernet", gi: "gigabitethernet",
  tengigabitethernet: "tengigabitethernet", tengig: "tengigabitethernet", te: "tengigabitethernet",
  fastethernet: "fastethernet", fas: "fastethernet", fa: "fastethernet",
  ethernet: "ethernet", eth: "ethernet", loopback: "loopback", lo: "loopback",
  "port-channel": "port-channel", po: "port-channel", vlan: "vlan", serial: "serial", se: "serial",
};

function platformFor(drill: CommandExercise): Platform {
  const mode = drill.mode.trim();
  if (/powershell|^PS(?:\s|>)/i.test(mode)) return "powershell";
  if (/command prompt|windows|^[a-z]:\\|^PC(?:-[\w]+)?>$/i.test(mode)) return "windows";
  if (/terminal|shell|linux|macos|\$|@/i.test(mode)) return "shell";
  return /^[\w.-]+(?:\([^)]*\))?[>#]$/.test(mode) ? "ios" : "shell";
}

/** Retain quote characters, case, escapes and whitespace inside quotes. */
function tokenize(text: string, platform: Platform): string[] | null {
  const result: string[] = [];
  let word = "", quote = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if ((platform === "shell" && ch === "\\" && quote !== "'") || (platform === "powershell" && ch === "`" && quote !== "'")) {
      word += ch;
      if (i + 1 < text.length) word += text[++i];
      continue;
    }
    if (quote) {
      word += ch;
      if (ch === quote) {
        if (platform === "powershell" && text[i + 1] === quote) word += text[++i];
        else quote = "";
      }
    } else if (ch === '"' || (ch === "'" && (platform === "shell" || platform === "powershell"))) {
      quote = ch;
      word += ch;
    } else if (/\s/.test(ch)) {
      if (word) result.push(word);
      word = "";
    } else word += ch;
  }
  if (quote) return null;
  if (word) result.push(word);
  return result;
}

function interfaceId(text: string): string | null {
  const match = /^([a-z-]+)\s*(\d+(?:\/\d+)*(?:\.\d+)?)$/i.exec(text.trim());
  if (!match) return null;
  const family = INTERFACES[match[1].toLowerCase()];
  return family ? family + match[2] : null;
}

function interfaceGroup(text: string): string | null {
  const single = interfaceId(text);
  if (single) return single;
  const range = /^(.+\d)\s*-\s*(\d+|[a-z-]+\s*\d+(?:\/\d+)*(?:\.\d+)?)$/i.exec(text.trim());
  if (!range) return null;
  const first = interfaceId(range[1]);
  if (!first) return null;
  const last = /^\d+$/.test(range[2]) ? first.replace(/\d+$/, range[2]) : interfaceId(range[2]);
  return last ? `${first}..${last}` : null;
}

function literalUnits(text: string, platform: Platform): Unit[] | null {
  return tokenize(text, platform)?.map(value => ({ text: value, kind: "argument", meaning: "the stated value" })) ?? null;
}

function canonicalUnits(drill: CommandExercise, platform: Platform): Unit[] | null {
  const syntax = drill.teaching?.syntax;
  // Missing or malformed annotation must never make literals less strict.
  if (!Array.isArray(syntax) || syntax.length === 0 || syntax.some(part => !part || typeof part.text !== "string" || !["keyword", "argument", "interface"].includes(part.kind)) || syntax.map(part => part.text).join(" ") !== drill.answer) return literalUnits(drill.answer, platform);
  const units: Unit[] = [];
  for (const part of syntax) {
    if (platform === "ios" && part.kind === "interface" && interfaceGroup(part.text)) units.push(part);
    else {
      const words = tokenize(part.text, platform);
      if (!words) return literalUnits(drill.answer, platform);
      units.push(...words.map(text => ({ ...part, text, kind: part.kind === "interface" ? "argument" as const : part.kind })));
    }
  }
  return units;
}

function keywordMatches(given: string, expected: string, previous: string, abbreviated: boolean): boolean {
  const g = given.toLowerCase(), e = expected.toLowerCase();
  if (g === e) return true;
  if (!abbreviated) return false;
  const min = e === "terminal" && previous.toLowerCase() === "configure" ? 1 : IOS_PREFIXES[e];
  return min !== undefined && g.length >= min && e.startsWith(g);
}

function isTestNetConnection(drill: CommandExercise, platform: Platform): boolean {
  return platform === "powershell" && /^Test-NetConnection(?:\s|$)/i.test(drill.answer);
}

function unitMatches(given: string, unit: Unit, previous: string, index: number, drill: CommandExercise, platform: Platform): boolean {
  // Cmdlet/parameter names are case-insensitive. Native programs launched from
  // PowerShell own their switches, so this exception is deliberately specific.
  if (isTestNetConnection(drill, platform) && ((index === 0 && unit.text.toLowerCase() === "test-netconnection") || /^-(?:Port|ComputerName)$/i.test(unit.text))) return given.toLowerCase() === unit.text.toLowerCase();
  if (unit.kind !== "keyword") return given === unit.text;
  if (platform === "ios") {
    // en is a familiar user-EXEC shortcut, but conflicts with end in configuration.
    if (index === 0 && />$/.test(drill.mode.trim()) && unit.text.toLowerCase() === "enable" && given.toLowerCase() === "en") return true;
    return keywordMatches(given, unit.text, previous, unit.abbreviated !== false);
  }
  if (platform === "windows" || (platform === "powershell" && index === 0)) return given.toLowerCase() === unit.text.toLowerCase();
  return given === unit.text;
}

function compare(given: string[], expected: Unit[], drill: CommandExercise, platform: Platform): Comparison {
  let at = 0;
  for (let i = 0; i < expected.length; i++) {
    const unit = expected[i];
    if (at >= given.length) return { correct: false, matched: at, reason: "missing", unit };
    if (platform === "ios" && unit.kind === "interface") {
      const target = interfaceGroup(unit.text);
      let consumed = 0;
      // Family and number can be joined or separated, as can a range's hyphen.
      for (let count = 1; count <= Math.min(8, given.length - at); count++) {
        if (target && interfaceGroup(given.slice(at, at + count).join(" ")) === target) { consumed = count; break; }
      }
      if (!consumed) return { correct: false, matched: at, reason: "different", unit, given: given[at] };
      at += consumed;
    } else {
      if (!unitMatches(given[at], unit, expected[i - 1]?.text ?? "", i, drill, platform)) return { correct: false, matched: at, reason: "different", unit, given: given[at] };
      at++;
    }
  }
  return at === given.length ? { correct: true, matched: at } : { correct: false, matched: at, reason: "extra" };
}

function alternativeUnits(text: string, canonical: Unit[], platform: Platform): Unit[] | null {
  const units = literalUnits(text, platform);
  if (!units || platform !== "ios") return units;
  // Reuse roles only when every position demonstrably has the same meaning:
  // unchanged arguments, and keywords equal to or shortening the same keyword.
  // A different grammar/value stays a finite literal alternative, never a guess.
  if (units.length !== canonical.length || !canonical.every((unit, i) => unit.kind === "keyword"
    ? keywordMatches(units[i].text, unit.text, canonical[i - 1]?.text ?? "", true)
    : units[i].text === unit.text)) return units;
  return units.map((unit, i) => canonical[i].kind === "keyword" ? { ...unit, kind: "keyword", abbreviated: false } : unit);
}

function hasPrompt(text: string): boolean {
  return /^(?:[a-z]:\\[^>\r\n]*>|PS(?:\s+[^>\r\n]*)?>|[^\s@]+@[^\s]+[$#]|[\w.-]+(?:\([^)]*\))?[>#])\s*/i.test(text);
}

function literalTail(text: string, platform: Platform): string | null {
  if (platform !== "ios") return null;
  // IOS output-filter expressions and descriptions consume the remaining text.
  // Spaces within those values are data, unlike separators between route operands.
  const command = text.split(/\s+/, 1)[0].toLowerCase();
  if (command.length >= 4 && "description".startsWith(command)) return /^\S+\s+(.+)$/.exec(text)?.[1] ?? null;
  const filter = /\|\s*(?:include|exclude|begin)\s+(.+)$/i.exec(text);
  return filter?.[1] ?? null;
}

function modeFeedback(given: string[], drill: CommandExercise, platform: Platform): string | null {
  if (platform !== "ios") return null;
  const config = /\([^)]*\)#$/.test(drill.mode.trim());
  const first = given[0]?.toLowerCase(), expected = drill.answer.split(/\s+/)[0].toLowerCase();
  if (first === "do" && expected !== "do") return config
    ? "The do prefix runs an EXEC command from configuration mode. This task asks for a configuration command, so enter that command directly."
    : "The displayed prompt is already an EXEC prompt. Enter the requested command without do; do is used to run EXEC commands from configuration mode.";
  if (expected === "do" && first !== "do" && config) return "At this configuration prompt, the requested EXEC command needs the do prefix. Keep the command and its values after do.";
  if (config && (first === "show" || first === "sh") && expected !== "show") return "This is a configuration prompt. A show command would need do on supporting IOS, but this task asks you to enter the requested setting.";
  if (config && (first === "configure" || first === "conf")) return "The displayed prompt is already in configuration mode. Enter only the requested command for this mode.";
  return null;
}

/** Grade one command for the stated platform and annotated syntax. */
export function gradeCommand(given: string, drill: CommandExercise): CommandGrade {
  const fail = (feedback: string): CommandGrade => ({ correct: false, feedback });
  const text = given.trim();
  if (!text) return fail("Enter the command required by the task, without the device or shell prompt.");
  if (/[\r\n]/.test(text)) return fail("Enter one command on one line. Leave out prompts, output, and commands for earlier steps.");
  if (hasPrompt(text)) return fail("Leave out the device or shell prompt. Enter only the command that follows the displayed prompt.");
  const platform = platformFor(drill);
  const words = tokenize(text, platform);
  if (!words) return fail("A quotation mark is not closed. Keep each quoted argument together and preserve its spelling and case.");
  const canonical = canonicalUnits(drill, platform);
  if (!canonical) return fail("The saved command cannot be matched safely. Review the answer and report this exercise.");
  const candidates = [{ text: drill.answer, units: canonical }, ...(drill.accept ?? []).map(text => ({ text, units: alternativeUnits(text, canonical, platform) })).filter((candidate): candidate is { text: string; units: Unit[] } => candidate.units !== null)];
  let best: Comparison = { correct: false, matched: -1 };
  for (const candidate of candidates) {
    const result = compare(words, candidate.units, drill, platform);
    if (result.correct) {
      const tail = literalTail(candidate.text, platform);
      if (tail === null || literalTail(text, platform) === tail) return { correct: true, feedback: "Correct for the requested task and displayed prompt." };
      best = { correct: false, matched: words.length, reason: "different", unit: { text: tail, kind: "argument", meaning: "literal text" } };
      continue;
    }
    if (result.matched > best.matched) best = result;
  }
  const mode = modeFeedback(words, drill, platform);
  if (mode) return fail(mode);
  if (best.reason === "extra") return fail("The required command is complete before the end of your answer. Remove the extra words, options, or second command.");
  if (best.reason === "missing") return fail(best.unit?.kind === "keyword"
    ? "The command is incomplete. Check the task for the remaining keyword or option, or use a hint."
    : "The command is incomplete. Supply the remaining value or interface required by the task.");
  if (best.unit?.kind === "interface") return fail("Check the interface family and its full slot/port or subinterface number. A supported short name such as Gi or Fa must still identify the exact requested interface.");
  if (best.unit?.kind === "argument") {
    const caseOnly = best.given?.toLowerCase() === best.unit.text.toLowerCase();
    if (caseOnly) return fail("A supplied value differs in capitalization. Preserve the exact case of the requested name, secret, filename, filter, or native-program option.");
    if (/^[/-]/.test(best.unit.text) && platform !== "ios") return fail("Check the full option and its case. Native shell options are matched exactly; IOS keyword abbreviations do not apply here.");
    return fail("A supplied value does not match the task. Check the complete name, address, number, text, or path requested; values are not abbreviated.");
  }
  return fail(platform === "ios"
    ? "Check the command keywords and their order for the displayed mode. This trainer accepts selected common abbreviations; use the full keyword if another abbreviation is not recognized."
    : "Check the command name, full keywords, and option order for this shell. Use the documented form or an explicitly accepted alternative; IOS abbreviations do not apply here.");
}

/** Legacy callers lack syntax metadata, so comparison is deliberately literal. */
export function matchesCommand(given: string, canonical: string): boolean {
  if (/[\r\n]/.test(given.trim()) || hasPrompt(given.trim())) return false;
  const g = tokenize(given, "shell"), c = tokenize(canonical, "shell");
  return !!g && !!c && g.length === c.length && c.every((word, i) => word === g[i]);
}

export function checkCommand(given: string, answer: string, accept: string[] = []): boolean {
  return [answer, ...accept].some(candidate => matchesCommand(given, candidate));
}
