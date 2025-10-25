const
  // { DocCommentHighlightRules } = ace.require("ace/mode/doc_comment_highlight_rules"),
  { TextHighlightRules } = ace.require('ace/mode/text_highlight_rules'),
  wordPattern = /[a-zA-Z_\xa1-\uffff][a-zA-Z0-9_\xa1-\uffff]*/.source,
  typeGeneratorRegex = [
    ...[2, 3, 4].flatMap(x => (
      [2, 3, 4].map(y => `mat${x}x${y}`)
    )),
    'vec2|vec3|vec4',
    'array|atomic|ptr',
    'texture_1d',
    'texture_2d|texture_2d_array',
    'texture_multisampled_2d',
    'texture_3d',
    'texture_cube|texture_cube_array',
    'texture_storage_1d',
    'texture_storage_2d',
    'texture_storage_2d_array',
    'texture_storage_3d'
  ].join('|'),
  typeRegex = [
    ...['f', 'h', 'i', 'u'].flatMap(t => (
      [2, 3, 4].flatMap(x => [
        `vec${x}${t}`,
        ...[2, 3, 4].map(y => `mat${x}x${y}${t}`),
      ])
    )),
    'bool|f16|f32|i32|u32',
    'sampler|sampler_comparison',
    'texture_depth_2d',
    'texture_depth_2d_array',
    'texture_depth_cube',
    'texture_depth_cube_array',
    'texture_multisampled_2d',
    'texture_external',
  ].join('|'),
  builtInFunctionRegex = [
    'bitcast',
    'all|any|select',
    'arrayLength',
    'abs|acos|acosh|asin|asinh|atan|atanh|atan2|ceil|clamp|cos|cosh|countLeadingZeros|countOneBits|countTrailingZeros|cross|degrees|determinant|distance|dot|dot4U8Packed|dot4I8Packed|exp|exp2|extractBits|faceForward|firstLeadingBit|firstTrailingBit|floor|fma|fract|frexp|insertBits|inverseSqrt|ldexp|length|log|log2|max|min|mix|modf|normalize|pow|quantizeToF16|radians|reflect|refract|reverseBits|round|saturate|sign|sin|sinh|smoothstep|sqrt|step|tan|tanh|transpose|trunc',
    'dpdx|dpdxCoarse|dpdxFine|dpdy|dpdyCoarse|dpdyFine|fwidth|fwidthCoarse|fwidthFine',
    'textureDimensions|textureGather|textureGatherCompare|textureLoad|textureNumLayers|textureNumLevels|textureNumSamples|textureSample|textureSampleBias|textureSampleCompare|textureSampleCompareLevel|textureSampleGrad|textureSampleLevel|textureSampleBaseClampToEdge|textureStore',
    'atomicLoad|atomicStore|atomicAdd|atomicSub|atomicMin|atomicMax|atomicAnd|atomicOr|atomicXor|atomicExchange|atomicCompareExchangeWeak',
    'pack4x8snorm|pack4x8unorm|pack4xI8|pack4xU8|pack4xI8Clamp|pack4xU8Clamp|pack2x16snorm|pack2x16unorm|pack2x16float',
    'unpack4x8snorm|unpack4x8unorm|unpack4xI8|unpack4xU8|unpack2x16snorm|unpack2x16unorm|unpack2x16float',
    'storageBarrier|textureBarrier|workgroupBarrier|workgroupUniformLoad',
    'subgroupAdd|subgroupExclusiveAdd|subgroupInclusiveAdd|subgroupAll|subgroupAnd|subgroupAny|subgroupBallot|subgroupBroadcast|subgroupBroadcastFirst|subgroupElect|subgroupMax|subgroupMin|subgroupMul|subgroupExclusiveMul|subgroupInclusiveMul|subgroupOr|subgroupShuffle|subgroupShuffleDown|subgroupShuffleUp|subgroupShuffleXor|subgroupXor',
    'quadBroadcast|quadSwapDiagonal|quadSwapX|quadSwapY'
  ].join('|')
export const WgslHighlightRules = class WgslHighlightRules extends TextHighlightRules {
  constructor() {
    super()
    // { return }
    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used
    const
      keywordMapper = this.createKeywordMapper({
        "keyword.control": 'continue|continuing|default|discard|else|for|if|loop|while|return|break|switch|case',
        "keyword": 'alias|const|const_assert|diagnostic|enable|fn|let|override|requires|struct|var',
        "storage.type": `${typeRegex}|${typeGeneratorRegex}`,
        "constant.language": 'true|false',
        "support.function": builtInFunctionRegex
      }, "identifier")
    
    const
      integerTypes = '[iu]32',
      floatTypes = 'f(?:16|32)',
      numericTypes = `${integerTypes}|${floatTypes}`,
      scalarTypes = `bool|${numericTypes}`,
      vectorTypes = /vec[2-4](?:[iufh]|(?=\s*[<\(])|(?:\s*<))/.source,
      matrixTypes = /mat[2-4]x[2-4](?:[fh]|(?=\s*[<\(])|(?:\s*<))/.source,
      atomicTypes = /atomic(?:(?=\s*[<\(])|(?:\s*<))/.source,
      valueTypes = [scalarTypes, vectorTypes, matrixTypes, atomicTypes].join('|'),
      arrayType = /array(?=\s*[<\(])/.source
    this.$rules = {
      start: [
        { include: 'basic' },
        { next: 'start' },
        {
          stateName: 'parentheses',
          push: [
            { token: 'paren.rparen', regex: /\)/, next: 'pop' },
            { include: 'basic' },
          ]
        },
        {
          stateName: 'squareBracket',
          push: [
            { token: 'paren.rparen', regex: /]/, next: 'pop' },
            { include: 'basic' },
          ]
        },
        {
          stateName: 'curlyBracket',
          push: [
            { token: 'paren.rparen', regex: /}/, next: 'pop' },
            { include: 'basic' },
          ]
        },
        {
          // token: "punctuation",
          // regex: `(?<=(?:${typeGeneratorRegex})\\s*)<(?!${/<|=|[^\[<(]*?(?:&&|\|\|)/.source})`,
          // regex: `(?<=(?:var|${typeGeneratorRegex})\\s*)<(?!${/<|=|[^\[<(]*?(?:&&|\|\|)/.source})`,
          stateName: 'templateList',
          push: [
            {
              token: "punctuation.definition",
              regex: /<(?!<|=)/,
              push: "templateList"
            },
            {
              token: "punctuation.definition",
              regex: />(?!=)/,
              next: "pop"
            },
            
            
            {
              regex: /(?=[^<>\[\(]*?(?:;|&&|\|\|))/,
              next: 'pop'
            },
            
            {
              token: "storage.modifier",
              regex: /(?<=\bvar\s*<\s*)(?:storage|uniform|workgroup|private|function)\b/
            },
            {
              token: "storage.modifier",
              regex: /(?<=\bvar\s*<\s*storage\s*,\s*)(?:read(?:_write)?\b)/
            },
            
            { include: "brackets" },
            { include: "comments" },
            { include: "punctuation" },
            { include: "operators" },
            { include: "constants" },
            
            {
              token: 'storage.type',
              regex: `${typeRegex}|${typeGeneratorRegex}`
            },
            {
              token: "entity.name.type",
              regex: `\\b${wordPattern}\\b`
            }
          ]
        }
      ],
      basic: [
        {
          token: 'entity.name.type',
          regex: `(?<=\\b(?:alias|struct)\\s+|(?:\\u0029\\s*->|:)\\s*)(?!${typeRegex}|${typeGeneratorRegex})${wordPattern}`
        },
        {
          token: 'entity.name.function',
          regex: `(?<=\\bfn\\s+)${wordPattern}`
        },
        {
          token: ['punctuation.definition', 'text', 'storage.modifier.attribute'],
          regex: `(@)(\\s*)(${wordPattern})`
        },
        { include: 'comments' },
        {
          token: 'punctuation.definition',
          regex: `(?<=var\\s*|(?:${typeGeneratorRegex})\\s*)<(?!${/<|=|[^<>\[\(]*?(?:&&|\|\|)/.source})`,
          push: 'templateList'
        },
        {
          token: 'identifier',
          regex: `(?:${builtInFunctionRegex})(?!\\s*\\()`
        },
        {
          token: 'entity.name.function',
          regex: `(?<=\\w+\\s*\\.\\s*)(?:${builtInFunctionRegex})`
        },
        {
          token: keywordMapper,
          regex: wordPattern
        },
        {
          token: 'entity.name.function',
          regex: `\\b${wordPattern}\\s*\\(`
        },
        { include: "brackets" },
        { include: "punctuation" },
        { include: "operators" },
        { include: "constants" }
      ],
      comments: [
        /*
        DocCommentHighlightRules.getStartRule("doc-start"),
        {
          token: 'comment.line.doc',
          regex: /\/\/\/.*$/
        }, {
          token: 'comment.line.doc',
          regex: /\/\/!.*$/
        },
        */
        {
          token: 'comment.line.double-dash',
          regex: /\/\/.*$/
        },
        {
          token: 'comment.start.block',
          regex: /\/\*/,
          stateName: 'comment',
          push: [
            {
              token: 'comment.start.block',
              regex: /\/\*/,
              push: 'comment'
            },
            {
              token: 'comment.end.block',
              regex: /\*\//,
              next: 'pop'
            },
            { defaultToken: 'comment.block' }
          ]
        }
      ],
      brackets: [
        { token: 'paren.lparen', regex: /\(/, push: 'parentheses' },
        { token: 'paren.lparen', regex: /\[/, push: 'squareBracket' },
        { token: 'paren.lparen', regex: /{/, push: 'curlyBracket' },
        {
          token: "paren.rparen",
          regex: /[\])}]/
        },
      ],
      punctuation: [
        {
          token: "punctuation.terminator",
          regex: /;/
        },
        {
          token: "punctuation.separator",
          regex: /:/
        },
        {
          token: "punctuation.delimiter",
          regex: /,/
        },
        {
          token: "punctuation.operator",
          regex: /\.(?:(?!\d)|(?=\d+\.))/
        },
      ],
      operators: [
        {
          token: 'keyword.operator.logical',
          regex: /!|&&|\|\|/
        },
        {
          token: 'keyword.operator.comparision',
          regex: /[!=]=|[<>]=?/
        },
        {
          token: 'keyword.operator',
          regex: /\$|[-=]>/
        },
        // `[*/](?![*/])` is separated because `//` and `/* */` become comments and must be
        // guarded against. This states either `*` or `/` may be matched as long as the match
        // it isn't followed by either of the two.
        {
          token: 'keyword.operator.assignment',
          regex: /(?:<<|>>|[-+%\|&]|[*/](?![*/]))?=/
        },
        {
          token: 'keyword.operator.arithmetic',
          regex: /<<|>>|[-+*&\|~]|[*/](?![*/])/
        }
      ],
      constants: [
        /0[xX][0-9a-fA-F]*\.[0-9a-fA-F]+([pP][+-]?[0-9]+[fh]?)?/,
        /0[xX][0-9a-fA-F]+\.[0-9a-fA-F]*([pP][+-]?[0-9]+[fh]?)?/,
        /0[xX][0-9a-fA-F]+[pP][+-]?[0-9]+[fh]?/,
        /0[xX][0-9a-zA-Z]+[iu]?/,
        
        /(?:0|[1-9][0-9]*)[fh]/,
        /[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?[fh]?/,
        /[0-9]+\.[0-9]*([eE][+-]?[0-9]+)?[fh]?/,
        /[0-9]+[eE][+-]?[0-9]+[fh]?/,
        /(?:0|[1-9][0-9]*)[iu]?/
      ].map(v => ({ token: "constant.numeric", regex: v }))
    }
    /*
    this.embedRules(DocCommentHighlightRules, "doc-",
      [ DocCommentHighlightRules.getEndRule("start") ]);
    */
    this.normalizeRules()
  }
}