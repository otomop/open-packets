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

A controller holds the inventory of every switch you manage, and a script can read it in one request, provided you can read what comes back. The reply is an HTTP status line, a few headers and a block of JSON. If you misread a `401` as a network fault, or a quoted `"24"` as a number, you will debug the wrong thing.

[Chapter 40](#/chapter/network-management-and-sdn) showed one such exchange between an application and a controller's northbound API. This chapter takes the exchange apart. By the end you will be able to name the REST constraints, match CRUD operations to HTTP verbs, interpret common status codes, tell Basic, API-key, bearer-token and OAuth authentication apart, and read nested JSON with its objects, arrays and value types.

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

The v1.1 objectives ask you to describe REST API characteristics and recognize the components of JSON. The v2.0 blueprint does not list them separately, but you need both to follow chapters 42 and 43.

## What makes an API RESTful

**Representational State Transfer (REST)** is a set of design rules for web APIs, not a protocol. An API that follows them is called RESTful. There are six:

- **Client-server**: the client asks and the server answers, and each can change independently.
- **Stateless**: every request carries everything needed to process it. The server keeps no memory of the client's previous request.
- **Cacheable**: each response says whether it may be stored and reused.
- **Uniform interface**: every resource is identified by a URI and handled with the same small set of methods.
- **Layered system**: a proxy or load balancer can sit between client and server without the client knowing.
- **Code on demand** (optional): the server may send code for the client to run.

**Stateless** does not mean the server stores nothing. Servers retain resource data, credentials, authorization information and logs. A token can identify an access context without making a client rely on a prior “select device R1” command remembered in an interactive terminal session.

Cacheable does not mean reusable forever: the response's cache headers set how long it stays fresh. Real products also follow these six rules to different degrees, so the API's own documentation decides exact behavior.

## Requests: URIs, verbs and headers

Consider `https://controller.example/api/devices?site=branch1`. The scheme is `https`, the authority identifies the server, `/api/devices` is the path and `site=branch1` is the query. A query's meaning is defined by the API; adding an undocumented filter does not guarantee filtering.

| Method | CRUD operation | Watch for |
|---|---|---|
| GET | **Read**: retrieve a resource | Never changes anything |
| POST | **Create**: add a new resource; the server usually picks its ID | Sending it twice can create two |
| PUT | **Update**: replace the whole resource with the body you send | Fields you leave out are lost |
| PATCH | **Update**: change only the fields you send | The API defines the body format |
| DELETE | **Delete**: remove the resource | A second DELETE may return `404` |

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

The pair that exams and real faults turn on is 401 and 403. `401 Unauthorized` means the server does not know who you are: the credentials are missing, wrong or expired. Despite its name it is about authentication. `403 Forbidden` normally means the server knows who you are and the answer is no: the account lacks permission for this operation. You fix a 401 by authenticating again and a 403 by changing what the account is allowed to do.

The first digit tells you where to look. `4xx` means the request was the problem: fix the URL, the credentials or the body before retrying. `5xx` means the server failed, and the same request may work later. A proxy between you and the controller can generate either kind, so record the status, the error body and any request identifier before changing several things at once.

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

An **API key** is a long secret string issued to you once and sent with every request, usually in a header. A **bearer token** is similar but short-lived: you authenticate, receive a token, send it as `Authorization: Bearer ...` and fetch a new one when it expires. Whoever holds a key or token can use it, which is why both must travel over HTTPS.

**OAuth 2.0** is the framework behind most token systems. Its purpose is delegation: an application obtains an access token with a limited scope from an authorization server, without ever seeing the user's password.

Cisco's own APIs show both patterns. The Meraki dashboard API takes an API key. Catalyst Center has you send Basic credentials once to an authentication endpoint, then present the returned token in an `X-Auth-Token` header on every later request.

When curl reports a certificate failure, inspect trust, hostname, expiry and the system clock. Suppressing validation with `--insecure` removes an important identity check. A lab can use a trusted private CA or a deliberately pinned certificate with the correct name; the existence of a self-signed certificate does not require bypassing verification.

## JSON: the data encoding you must read

**JSON** (JavaScript Object Notation) is text built from two structures and four simple values. An **object** is a set of `"key": value` pairs inside braces `{}`: each key is a double-quoted string, a colon separates the key from its value and commas separate the pairs. An **array** is an ordered list of values inside brackets `[]`. A value can be an object, an array, a string, a number, a boolean or `null`, so objects and arrays nest inside each other.

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

Avoid duplicate keys in one object, because parsers handle them differently.

## JSON, XML and YAML side by side

JSON, XML and YAML are data representations, not authentication or encryption schemes. Their syntax can help identify the format, but each API or tool defines the supported schema.

| Format | Recognizable structure | Common networking use |
|---|---|---|
| JSON | Braces, brackets, quoted object names | HTTP API data |
| XML | Elements such as `<name>R1</name>` | NETCONF messages |
| YAML | Indented mappings and sequence markers | Ansible playbooks and inventory |

Here is one record in each format. JSON: `{"hostname": "R1", "enabled": true}`. XML: `<device><hostname>R1</hostname><enabled>true</enabled></device>`. YAML:

```yaml
hostname: R1
enabled: true
```

YAML shows nesting by indentation and starts each list item with `-`. [Chapter 42](#/chapter/ansible-terraform) uses it for Ansible playbooks.

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

- REST is an architectural style with six constraints. HTTP carries the requests, JSON encodes the data and HTTPS (TLS) protects them.
- CRUD: POST creates, GET reads, PUT replaces, PATCH modifies, DELETE removes. GET, PUT and DELETE are idempotent; POST and PATCH are not.
- 2xx is success, 4xx a client error, 5xx a server error. 401 is about authentication, 403 about authorization, 404 means not found, and 202 means accepted but not finished.
- Authentication types: Basic (Base64, which is not encryption), API key, bearer token and OAuth 2.0.
- JSON: objects are key:value pairs in braces, arrays are lists in brackets, strings use double quotes, and `true`, `false` and `null` are lowercase. Valid syntax can still be the wrong type for the API.
