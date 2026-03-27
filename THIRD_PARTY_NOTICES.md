# Third-Party Notices

This repository contains original PoE Impact View code together with vendored and bundled third-party software.

The root [LICENSE](LICENSE) applies only to the original code written for this project, except where a file or directory carries its own license notice.

## Included Third-Party Software

| Component | Used For | Distribution Form | License |
| --- | --- | --- | --- |
| Path of Building Community | Upstream calculation engine and data files | Vendored source tree in `PathOfBuilding-dev/` | MIT, with additional notices inside upstream tree |
| wasmoon 1.16.0 | Browser-hosted Lua VM | Bundled into `lib/wasmoon-bundle.js` and `lib/glue.wasm` | MIT |
| pako 2.1.0 | Deflate/inflate support for PoB build codes | Bundled into `lib/pako-bundle.js` | MIT and Zlib |
| esbuild 0.27.4 | Build-time bundling tool | Development dependency only | MIT |

## Vendored Upstream Source

### Path of Building Community

The directory `PathOfBuilding-dev/` is a vendored upstream snapshot used by the extension runtime.

- Upstream project: Path of Building Community
- Upstream license file: `PathOfBuilding-dev/LICENSE.md`
- License: MIT

That upstream license file also contains additional notices for components shipped inside the upstream source tree. Do not remove or replace it when redistributing this repository or any package that includes `PathOfBuilding-dev/`.

## Bundled Runtime Assets

### wasmoon 1.16.0

Files in this repository generated from wasmoon:

- `lib/wasmoon-bundle.js`
- `lib/glue.wasm`

Upstream project: <https://github.com/ceifa/wasmoon>

License text:

```text
MIT License

Copyright (c) 2023 Gabriel Francisco

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### pako 2.1.0

Files in this repository generated from pako:

- `lib/pako-bundle.js`

Upstream project: <https://github.com/nodeca/pako>

MIT portion:

```text
(The MIT License)

Copyright (C) 2014-2017 by Vitaly Puzrin and Andrei Tuputcyn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

Zlib portion used by pako's `lib/zlib` content:

```text
Copyright (C) 1995-2013 Jean-loup Gailly and Mark Adler

This software is provided 'as-is', without any express or implied
warranty. In no event will the authors be held liable for any damages
arising from the use of this software.

Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it
freely, subject to the following restrictions:

1. The origin of this software must not be misrepresented; you must not
   claim that you wrote the original software. If you use this software
   in a product, an acknowledgment in the product documentation would be
   appreciated but is not required.
2. Altered source versions must be plainly marked as such, and must not be
   misrepresented as being the original software.
3. This notice may not be removed or altered from any source distribution.
```

### esbuild 0.27.4

esbuild is used only during development to build vendored browser bundles. It is not loaded by the shipped extension at runtime.

Upstream project: <https://github.com/evanw/esbuild>

License text:

```text
MIT License

Copyright (c) 2020 Evan Wallace

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Trademarks And Affiliation

PoE Impact View is an unofficial fan-made tool.

- Path of Exile and related marks are property of Grinding Gear Games.
- Path of Building is a separate upstream project and this repository is not endorsed by, affiliated with, or maintained by the Path of Building Community project.
- `pob.cool`, `pobb.in`, `poe.ninja`, and the official Path of Exile services belong to their respective operators.

Use of those names in this repository is purely nominative and descriptive.