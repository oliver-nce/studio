// NCE Studio — Safe Expression Evaluator
// Replaces unsafe new Function() / eval() for evaluating condition strings.
//
// Supports a restricted subset of JavaScript expressions:
//   - Property access: data.fieldname, data.nested.path
//   - Comparisons: ==, ===, !=, !==, >, <, >=, <=
//   - Logical: &&, ||, !
//   - Literals: strings, numbers, booleans (true/false), null, undefined
//   - Parenthetical grouping: (expr)
//
// Does NOT support: function calls, assignment, new, delete, typeof,
// template literals, array/object construction, or any other JS feature.

type Token =
	| { type: "number"; value: number }
	| { type: "string"; value: string }
	| { type: "boolean"; value: boolean }
	| { type: "null" }
	| { type: "undefined" }
	| { type: "identifier"; value: string }
	| { type: "dot" }
	| { type: "lparen" }
	| { type: "rparen" }
	| { type: "not" }
	| { type: "operator"; value: string }

function tokenize(expr: string): Token[] {
	const tokens: Token[] = []
	let i = 0

	while (i < expr.length) {
		const ch = expr[i]

		// Whitespace
		if (/\s/.test(ch)) {
			i++
			continue
		}

		// Numbers
		if (/[0-9]/.test(ch) || (ch === "-" && i + 1 < expr.length && /[0-9]/.test(expr[i + 1]) && (tokens.length === 0 || ["operator", "lparen", "not"].includes(tokens[tokens.length - 1].type)))) {
			let num = ""
			if (ch === "-") {
				num += "-"
				i++
			}
			while (i < expr.length && /[0-9.]/.test(expr[i])) {
				num += expr[i]
				i++
			}
			tokens.push({ type: "number", value: parseFloat(num) })
			continue
		}

		// Strings (single or double quoted)
		if (ch === '"' || ch === "'") {
			const quote = ch
			i++
			let str = ""
			while (i < expr.length && expr[i] !== quote) {
				if (expr[i] === "\\") {
					i++
					if (i < expr.length) str += expr[i]
				} else {
					str += expr[i]
				}
				i++
			}
			i++ // skip closing quote
			tokens.push({ type: "string", value: str })
			continue
		}

		// Identifiers and keywords
		if (/[a-zA-Z_$]/.test(ch)) {
			let ident = ""
			while (i < expr.length && /[a-zA-Z0-9_$]/.test(expr[i])) {
				ident += expr[i]
				i++
			}
			if (ident === "true") tokens.push({ type: "boolean", value: true })
			else if (ident === "false") tokens.push({ type: "boolean", value: false })
			else if (ident === "null") tokens.push({ type: "null" })
			else if (ident === "undefined") tokens.push({ type: "undefined" })
			else tokens.push({ type: "identifier", value: ident })
			continue
		}

		// Operators
		if (ch === "." && (i + 1 >= expr.length || !/[0-9]/.test(expr[i + 1]))) {
			tokens.push({ type: "dot" })
			i++
			continue
		}
		if (ch === "(") { tokens.push({ type: "lparen" }); i++; continue }
		if (ch === ")") { tokens.push({ type: "rparen" }); i++; continue }
		if (ch === "!") {
			if (expr[i + 1] === "=" && expr[i + 2] === "=") {
				tokens.push({ type: "operator", value: "!==" }); i += 3
			} else if (expr[i + 1] === "=") {
				tokens.push({ type: "operator", value: "!=" }); i += 2
			} else {
				tokens.push({ type: "not" }); i++
			}
			continue
		}
		if (ch === "=" && expr[i + 1] === "=" && expr[i + 2] === "=") {
			tokens.push({ type: "operator", value: "===" }); i += 3; continue
		}
		if (ch === "=" && expr[i + 1] === "=") {
			tokens.push({ type: "operator", value: "==" }); i += 2; continue
		}
		if (ch === ">" && expr[i + 1] === "=") {
			tokens.push({ type: "operator", value: ">=" }); i += 2; continue
		}
		if (ch === "<" && expr[i + 1] === "=") {
			tokens.push({ type: "operator", value: "<=" }); i += 2; continue
		}
		if (ch === ">") { tokens.push({ type: "operator", value: ">" }); i++; continue }
		if (ch === "<") { tokens.push({ type: "operator", value: "<" }); i++; continue }
		if (ch === "&" && expr[i + 1] === "&") {
			tokens.push({ type: "operator", value: "&&" }); i += 2; continue
		}
		if (ch === "|" && expr[i + 1] === "|") {
			tokens.push({ type: "operator", value: "||" }); i += 2; continue
		}

		// Unknown character — reject
		throw new Error(`Unexpected character '${ch}' in condition expression`)
	}

	return tokens
}

// Operator precedence (higher = binds tighter)
function precedence(op: string): number {
	switch (op) {
		case "||": return 1
		case "&&": return 2
		case "==": case "===": case "!=": case "!==": return 3
		case "<": case ">": case "<=": case ">=": return 4
		default: return 0
	}
}

function parse(tokens: Token[], data: Record<string, any>): any {
	let pos = 0

	function peek(): Token | undefined { return tokens[pos] }
	function advance(): Token { return tokens[pos++] }

	function parseExpression(minPrec = 0): any {
		let left = parseUnary()

		while (pos < tokens.length) {
			const tok = peek()
			if (!tok || tok.type !== "operator") break

			const prec = precedence(tok.value)
			if (prec <= minPrec) break

			advance() // consume operator
			const right = parseExpression(prec)

			switch (tok.value) {
				case "||": left = left || right; break
				case "&&": left = left && right; break
				case "==": left = left == right; break
				case "===": left = left === right; break
				case "!=": left = left != right; break
				case "!==": left = left !== right; break
				case "<": left = left < right; break
				case ">": left = left > right; break
				case "<=": left = left <= right; break
				case ">=": left = left >= right; break
			}
		}

		return left
	}

	function parseUnary(): any {
		const tok = peek()
		if (tok && tok.type === "not") {
			advance()
			return !parseUnary()
		}
		return parsePrimary()
	}

	function parsePrimary(): any {
		const tok = peek()
		if (!tok) throw new Error("Unexpected end of expression")

		// Parenthesised group
		if (tok.type === "lparen") {
			advance()
			const val = parseExpression()
			const closeParen = advance()
			if (!closeParen || closeParen.type !== "rparen") {
				throw new Error("Missing closing parenthesis")
			}
			return val
		}

		// Literals
		if (tok.type === "number") { advance(); return tok.value }
		if (tok.type === "string") { advance(); return tok.value }
		if (tok.type === "boolean") { advance(); return tok.value }
		if (tok.type === "null") { advance(); return null }
		if (tok.type === "undefined") { advance(); return undefined }

		// Identifier — resolve as property path on data
		if (tok.type === "identifier") {
			advance()
			let value: any

			// "data" refers to the data object itself
			if (tok.value === "data") {
				value = data
			} else {
				// Bare identifier — look up in data (convenience shorthand)
				value = data?.[tok.value]
			}

			// Follow dot-notation property access
			while (pos < tokens.length && peek()?.type === "dot") {
				advance() // consume dot
				const propTok = advance()
				if (!propTok || propTok.type !== "identifier") {
					throw new Error("Expected property name after '.'")
				}

				// Block prototype access
				if (propTok.value === "__proto__" || propTok.value === "constructor" || propTok.value === "prototype") {
					throw new Error(`Access to '${propTok.value}' is not allowed`)
				}

				value = value?.[propTok.value]
			}

			// Block function calls — if next token is '(', reject
			if (pos < tokens.length && peek()?.type === "lparen") {
				throw new Error("Function calls are not allowed in condition expressions")
			}

			return value
		}

		throw new Error(`Unexpected token: ${JSON.stringify(tok)}`)
	}

	const result = parseExpression()

	if (pos < tokens.length) {
		throw new Error(`Unexpected token at position ${pos}: ${JSON.stringify(tokens[pos])}`)
	}

	return result
}

/**
 * Safely evaluate a condition expression against a data object.
 *
 * Returns `true` if the condition evaluates to a truthy value.
 * Returns `true` on any error (fail-safe: show the element).
 *
 * @example
 *   safeEvaluateCondition('data.status === "Active"', { status: "Active" }) // true
 *   safeEvaluateCondition('data.amount > 0 && data.enabled', { amount: 10, enabled: true }) // true
 *   safeEvaluateCondition('!data.hidden', { hidden: false }) // true
 */
export function safeEvaluateCondition(
	condition: string,
	formData: Record<string, any>,
): boolean {
	if (!condition || !condition.trim()) return true

	try {
		const tokens = tokenize(condition.trim())
		const result = parse(tokens, formData)
		return !!result
	} catch {
		// Fail-safe: show the element if condition cannot be evaluated
		return true
	}
}
