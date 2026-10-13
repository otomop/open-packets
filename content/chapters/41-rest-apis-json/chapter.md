---
id: rest-apis-json
number: 41
title: "REST APIs and JSON"
subtitle: "Read requests, responses, credentials and structured network data accurately."
part: automation
domain: none
minutes: { lesson: 70, lab: 65 }
summary: "Interpret REST-style HTTP exchanges and JSON without confusing encoding, authentication, authorization, transport protection or a completed network change."
objectives:
  v1: ["6.5", "6.7"]
  v2: []
prereqs: [tcp-udp-ports, network-management-and-sdn]
sectionIds:
  Why network engineers read HTTP: why-a-network-engineer-reads-http
  Authentication and transport protection: authentication-four-ways-to-prove-who-you-are
sources:
  - { title: "Cisco: CCNA v1.1 objectives", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf" }
  - { title: "Cisco: announced CCNA v2.0 objectives", url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf" }
  - { title: "RFC 9110: HTTP semantics", url: "https://www.rfc-editor.org/rfc/rfc9110.html" }
  - { title: "RFC 5789: PATCH", url: "https://www.rfc-editor.org/rfc/rfc5789" }
  - { title: "RFC 8259: JSON", url: "https://www.rfc-editor.org/rfc/rfc8259" }
  - { title: "RFC 7617: Basic authentication", url: "https://www.rfc-editor.org/rfc/rfc7617" }
  - { title: "RFC 6750: bearer token usage", url: "https://www.rfc-editor.org/rfc/rfc6750" }
  - { title: "RFC 6749: OAuth 2.0 framework", url: "https://www.rfc-editor.org/rfc/rfc6749" }
  - { title: "Fielding: REST architectural constraints", url: "https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm" }
  - { title: "Cisco Meraki: API authentication", url: "https://developer.cisco.com/meraki/api-v1/authorization/" }
  - { title: "Cisco: Catalyst Center authentication API", url: "https://developer.cisco.com/docs/catalyst-center/authentication-api/" }
  - { title: "RFC 8446: TLS 1.3", url: "https://www.rfc-editor.org/rfc/rfc8446" }
  - { title: "YAML specification 1.2.2", url: "https://yaml.org/spec/1.2.2/" }
  - { title: "Python: official downloads", url: "https://www.python.org/downloads/" }
  - { title: "curl: command reference", url: "https://curl.se/docs/manpage.html" }
  - { title: "Python: http.server", url: "https://docs.python.org/3/library/http.server.html" }
  - { title: "Python: JSON parsing and compliance limits", url: "https://docs.python.org/3/library/json.html" }
---

A network API gives software a defined way to request information or operations. Reading an exchange requires several separate questions: which resource is addressed, what operation is requested, how is access established, what does the status mean, and how is the returned data structured? You do not need to become an application developer to answer those questions accurately.

## Why network engineers read HTTP

:::facts
- REST is an architectural style. HTTP supplies application-level request/response semantics; JSON is a data format.
- Common CRUD mappings: create `POST`, read `GET`, replace/create-at-a-known-URI `PUT`, partial modification `PATCH`, remove `DELETE`. Follow the API contract.
- `Content-Type` describes the message body. `Accept` expresses acceptable response formats.
- JSON has objects, arrays, strings, numbers, booleans and `null`.
- Basic encoding, bearer credentials and JSON formatting do not encrypt a connection. HTTPS uses TLS; certificate and hostname verification matter.
:::

A controller may expose inventory, interfaces, tasks and policies as **resources**. A script reads them using documented paths and data models. Structured output can be easier to process than CLI text, but it still needs interpretation. A field named “reachable” may reflect the last collection; a successful task submission may not mean a device was changed.

Chapter 40 used a successful `GET` response to discuss controller inventory freshness. Now read the whole exchange: the requested operation, credentials, status and typed data. **CRUD** is shorthand for create, read, update and delete; the table below relates those operations to common HTTP methods without replacing an API's own contract.

The v1.1 objectives ask you to describe REST characteristics and recognize JSON components. The announced v2.0 blueprint does not name those standalone objectives. This chapter remains useful preparation for controller and automation work; it does not claim that deploying a RESTCONF service is required here.

## What makes an API RESTful

**Representational State Transfer (REST)** describes architectural constraints. Client/server separation gives each side a defined responsibility. A stateless interaction carries the context needed to interpret the request rather than depending on a hidden sequence of conversational steps. Responses indicate whether and how they may be cached. A uniform interface lets clients interact through consistent resource identification and representations. Layering permits intermediaries. Code on demand is optional.

**Stateless** does not mean the server stores nothing. Servers retain resource data, credentials, authorization information and logs. A token can identify an access context without making a client rely on a prior “select device R1” command remembered in an interactive terminal session.

Caching also does not mean every response is safe to reuse forever. Cache instructions and freshness determine whether a stored response can answer a request. Sensitive responses need appropriate handling. A controller inventory record and its timestamp should be interpreted together.

Many products call their HTTP APIs REST APIs while implementing different subsets of REST conventions. An HTTPS endpoint returning JSON is not, by that fact alone, proof of every REST constraint. For CCNA interpretation, know the architecture and read the supplied API contract rather than inventing behavior from a product label.

## Requests: URIs, verbs and headers

Consider `https://controller.example/api/devices?site=branch1`. The scheme is `https`, the authority identifies the server, `/api/devices` is the path and `site=branch1` is the query. A query's meaning is defined by the API; adding an undocumented filter does not guarantee filtering.

| Method | Common use | Important qualification |
|---|---|---|
| GET | Retrieve a representation | Read semantics; do not use it to request a configuration change |
| POST | Submit data for processing, often create a subordinate resource | Repeating it can create another operation |
| PUT | Set the target resource's representation | Can replace or create when the API permits |
| PATCH | Apply a partial modification | Interpretation depends on the patch media type |
| DELETE | Remove the target's association/resource | A second deletion may return a different response |

A **safe** method does not request a state-changing action. Logging a GET or incrementing a request counter does not make GET unsafe: those incidental effects differ from the requested operation.

An **idempotent** method has the same intended state effect after repeated identical requests. GET, PUT and DELETE are idempotent by their HTTP semantics; POST and PATCH are not guaranteed to be. A second DELETE can return `404` after the first returned `204`, yet the intended result remains “resource absent.”

If a POST times out, the request may have succeeded and only the reply been lost. Blindly repeating it can duplicate a job or collide with an existing object. Read the API's status lookup, identifier or idempotency-key facilities. A method label does not remove the need to reconcile an uncertain outcome.

For a JSON body, `Content-Type: application/json` identifies its media type. `Accept: application/json` says the client accepts that format in the response. Neither header grants access. A **schema** defines the expected structure, field types and constraints. It determines whether fields such as `enabled` must be boolean and whether a resource name is valid.

## Responses: status codes

Read the status before trying to parse a success body. An error may have a different JSON structure or even an HTML body supplied by an intermediary.

| Code/class | Meaning | Appropriate interpretation |
|---|---|---|
| 1xx / 2xx / 3xx | Informational / successful / redirection | Follow the specific response semantics |
| 200 / 201 | Successful response / resource created | Read the representation and any Location header |
| 202 / 204 | Accepted for processing / success without content | 202 is not completion; 204 has no body to parse |
| 400 / 401 / 403 | Bad request / valid authentication credentials missing / refused request | Inspect the error and documented authorization policy |
| 404 / 405 / 409 | Resource not found / method not allowed / state conflict | Verify target, supported method and current state |
| 429 | Too many requests | Respect documented backoff and Retry-After when provided |
| 500 / 502 / 503 | Internal error / invalid upstream response / temporarily unavailable | Diagnose and retry only with appropriate safety and backoff |

`401 Unauthorized` indicates that the request lacks valid authentication credentials for the target; the name can be misleading. `403 Forbidden` indicates refusal. Insufficient permission is a common cause, but 403 does not universally prove that the caller was successfully authenticated. A server can also conceal a forbidden resource using 404.

A 4xx or 5xx class helps classify the response; it does not allocate personal blame or prove the root cause. A proxy can generate an error before the controller receives the request. A 503 does not prove every part of the submitted body was valid. Capture the status, relevant headers, safe error detail and request identifier before changing several variables.

:::trap Accepted is not completed
A `202` response can provide a task URL. Inspect that task according to the API contract until it reaches a terminal state. Then verify the required network result; an accepted job is not evidence that every device now has the intended configuration.
:::

## Authentication and transport protection

**Authentication** establishes an identity or accepted credential context. **Authorization** determines permitted operations. **TLS** protects the channel and normally authenticates the server through certificate validation. These are related but different checks.

| Mechanism | Typical representation | What to remember |
|---|---|---|
| HTTP Basic | `Authorization: Basic ...` | Base64 of username:password; reversible encoding |
| API key | Documented header containing an issued secret | Treat it as a credential; location/lifetime are API-specific |
| Bearer credential | `Authorization: Bearer ...` | Possession grants the represented access; token format is not fixed |
| OAuth 2.0 | Framework for obtaining access tokens | Grants, scopes and optional refresh behavior depend on the flow |

Basic's encoding does not hide a password from someone who can read the header. Use authenticated HTTPS for real credentials. With curl, `--user username` can request a password interactively; embedding a password directly in a command risks shell-history or process-list exposure.

An API key can be carried using a vendor header or, where documented, a Bearer header. A Bearer header alone does not prove OAuth was used. Tokens may be opaque strings or structured formats; they are not necessarily JWTs and do not all expire after one hour.

OAuth is an authorization framework that can support delegated access. Modern suitable flows avoid giving the client the user's password. Not every flow returns a refresh token, and client-credentials flows concern the application's own access. Do not infer a complete OAuth exchange merely from the word “token.”

Cisco APIs provide concrete examples. Meraki documents API-key and OAuth mechanisms. Catalyst Center APIs commonly use an authentication endpoint and an `X-Auth-Token` header. Read the exact product/version documentation for acquisition, lifetime and permissions. This course supplies no supposedly permanent public sandbox password.

When curl reports a certificate failure, inspect trust, hostname, expiry and the system clock. Suppressing validation with `--insecure` removes an important identity check. A lab can use a trusted private CA or a deliberately pinned certificate with the correct name; the existence of a self-signed certificate does not require bypassing verification.

## JSON: the data encoding you must read

**JSON** is a text representation with six value categories. Object member names are double-quoted strings; arrays preserve item order. Object member order should not carry application meaning.

| Type | Example | Distinguish from |
|---|---|---|
| Object | `{"name":"R1"}` | An array of values |
| Array | `["Gi0/0","Gi0/1"]` | A single comma-containing string |
| String | `"24"` | Number `24` |
| Number | `24`, `1.5` | Hex, NaN or quoted digits |
| Boolean | `true`, `false` | `"false"` or `False` |
| Null | `null` | A missing member, empty string or zero |

```json
{
  "response": [
    {"id": "r1", "hostname": "R1", "enabled": true, "ports": 3},
    {"id": "r2", "hostname": "R2", "enabled": false, "ports": "3"}
  ],
  "next": null
}
```

Start outside and move inward. The top-level object has `response` and `next`. `response` is an array of two objects. In **zero-based indexing**, position `0` is the first item and `1` is the second. In the path `response[1].hostname`, select the second object from `response`, then its member named `hostname`: the result is `"R2"`. The first device's `ports` is a number; the second's is a string. The characters look similar, but an API schema may accept only one type.

JSON has no comments, single-quoted strings or trailing commas. Booleans and null are lowercase. Strings use escapes for characters such as quotes, backslashes and newlines. A complete JSON document can be any single JSON value, not just an object or array.

Syntactic validity does not establish semantic validity. `{"enabled":"false"}` is valid JSON but may violate an API's boolean requirement. Missing `enabled`, `"enabled":null` and `"enabled":false` can mean three different things. Avoid relying on a programming language's conversion of strings to truth values.

Duplicate member names should be avoided: implementations can handle them differently. Some parsers also accept extensions. Python's default decoder accepts NaN and Infinity, for example, although JSON numbers exclude them. The lab rejects those constants explicitly. Do not call a tool a universally strict validator without checking its options and behavior.

## JSON, XML and YAML side by side

JSON, XML and YAML are data representations, not authentication or encryption schemes. Their syntax can help identify the format, but each API or tool defines the supported schema.

| Format | Recognizable structure | Common networking use |
|---|---|---|
| JSON | Braces, brackets, quoted object names | HTTP API data |
| XML | Elements such as `<name>R1</name>` | NETCONF messages |
| YAML | Indented mappings and sequence markers | Ansible playbooks and inventory |

YAML supports more styles than indentation alone, and modern YAML specifications accommodate JSON syntax. XML values gain interpretation through the consuming application or schema. The goal here is reliable recognition and reading; Chapter 42 teaches the configuration-management workflow.

## Reading the output

This authored exchange illustrates an HTTP/1.1 representation. HTTP/2 and HTTP/3 encode messages differently; the methods, headers and status semantics remain meaningful.

```output Representative inventory exchange
GET /api/devices HTTP/1.1                         ← method and target
Host: controller.example
Authorization: Bearer fictional-training-token  ← credential representation, not evidence of OAuth
Accept: application/json                         ← requested response media type

HTTP/1.1 200 OK                                  ← successful response
Content-Type: application/json                   ← representation format

{"response":[{"id":"r1","enabled":true}],"next":null}  ← array inside an object
```

Read in order: target and operation; authentication context; response status and headers; body structure and types; then what has actually been established. A `200` inventory response establishes a successful read of that resource, not that a later configuration request is permitted.

With curl, `-i` includes **response** headers; it does not print the outgoing request line and headers. Verbose/debug traces can show outgoing details but may expose secrets. Keep the request description separate from captured response output and redact credentials before sharing diagnostic evidence.

## Exam focus

- Distinguish REST style, HTTP semantics, HTTPS protection and JSON encoding.
- Interpret CRUD mappings, safe/idempotent methods and uncertain outcomes without blind retries.
- Separate missing valid credentials, refused authorization and unrelated network/TLS failures.
- Read nested JSON types and paths; distinguish syntax from schema validity.
- Treat product-specific endpoint paths, token lifetimes and rate limits as documented implementation details rather than universal constants.
