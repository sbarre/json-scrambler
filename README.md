# JSON Scrambler

**Randomly mutate a JSON object to add, remove or change properties for testing purposes. Always returns back valid JSON.**

## What is this about?

Have you ever wanted to easily test your code's ability to handle unexpected or incorrect JSON? Not _invalid_ JSON, but _incorrect_ JSON.

JSON Scrambler will take any arbitrary valid JSON and use predefined modifiers to make random and unexpected changes to the document structure, returning a modified document that still parses as valid JSON.

You can control how subtle, or not subtle, the changes are. From simple modifications like adding extra keys or values, shuffling array positions, or replacing values with nulls, all the way up to returning a completely unrecognizable document from the input.

JSON Scrambler can be used for testing the robustness of any program that accepts JSON input (such as an API or microservice) by providing infinite variations on existing JSON documents in ways that are unpredictable and random.

This library was inspired by the well-known concept of [fuzzing](https://en.wikipedia.org/wiki/Fuzzing) but with the added constraint that the randomized data needs to remain valid JSON.

## Installation

To install json-scrambler, use npm:

```bash
$ npm install json-scrambler
```

> [!NOTE] > **NPM doesn't work yet.**
> If you want to use this today, clone the repo, run `npm install` and then `npm run build` and look in the `dist` folder.

## Usage

```javascript
import scramble from 'json-scrambler';

const json = '{
  "name": "First Last",
  "uid": 148,
  "stuff": [
    "Item",
    "Other Item",
    48,
    2344,
    [
      {
        "someValue": "Twelve"
      },
      1209120,
      "Help"
    ]
  ]
}';

const scrambled = scramble(json, { chaos: 50 });
```

The `chaos` option controls how much the JSON is scrambled. A value of `0` makes no changes to the JSON and simply passes it through unchanged, while a value of `100` or higher will completely scramble the document. The default `chaos` is `10`.

The contents of `scrambled` from the code above could then look like this:

```json
{
  "KNsen": "kZsl",
  "B7CT": 148,
  "X4x": [
    "Item",
    "Other Item",
    48,
    2344,
    [
      { "someValue": "_&cN}#B2 6$D>R;?$/ul^K)Vg)fDW-Q)J:O WD1|" },
      49676383046,
      "YK+`uXv6j<EqWGbG$b>|e,8c:$g"
    ]
  ],
  "cV4i53J": []
}
```

It could also look like this:

```json
{
  "name": "A8lIj;\\kxTgO OCIJP}EZ5@xh_hULMFFM`H,/tgC2Zg8$R;Pap+B1}0PA3jF~q7\\~Q|nD7=P0nMd<vbOCHrQwU(,!}IPyeM{9~s(w-.8CBq}PO2/bnNp;R.piXf6K84X]ADb626^ITi~c^x:9[oS3:mei=\\uE*Ai-}uPMj}L`Q0C`\\QMnj=PG>~t+mRx91y5]D!k-KN%:-` >1i#6Va[Xl?1TwaC)%4/br#H9.4,:OmH +V](kA%Y!CP=g5#=4)`YlXwf/O2Ci(@Xh{Sk=5e/7od*NOP2`^KhhzRGuVP8ry$_80tu1i3&USiZ03sE[5K|1O4SIm<kSQ(~NY%5Oyfo,9j,wlvUuZ1`Y#)q{,D&Ff~nv{]DCe^esvu9yc`NvodohFAOV>%UQ%q:4}Q*]k?q0fhn][<1( /}&Zh`M&r\\%?Lj8?mrVzF#)-D6av S5X+JBG3 ;!B:7YOc!jKG$/BJ^MI9Yj_)0o~`1bxzq}i#tG:(/D?hZ`^/*5*Vhs%N6JO.bD(VXSh.V)Kva[@<`W5<\\KI_xt}Dcq6hogfYWUB4-%ggH8`.b2Wq>jt>6~To/[yK*h2<PP6`w>qXEdaa|c%y8X! =\\48/p< d[hC.#N2C9b|2k4!C7c%.Z\\\\%@6f -#IN CnABLWvB(^wWl.0c3EtWS0=3&%ky&C4|{?8QL;WPTm$L oB1^Djl(0{5m9v9XrP=*LoR,S#~6HR~9]O+4=L`Ab1BWR I4rV<>2l^7teRm3i9357p=LkF#Jp;w7=}j]eh`qI&,0\\m\\9twH*=yy:aA<Pgk<W`WUCSZVqg+prP*/fenED[R#g+N2:C(&(7>=u4b:uLlp4=J?N(CK[#{zJVNaeL6v kSo:gC*%ZSLt{:~VkTU}!~#ydx_P+vXTgN,Fow",
  "0P5h6QN": 148,
  "a": [26238, null, "Other Item", "Item", 21056838324],
  "tSKn3XthzwuvxtLyOz6BDO2dO7zoeC8p51h6G82nTo2MC": [3409, "j<EqWGb"]
}
```

The scrambling can randomize strings, numbers and object keys, add, remove or shuffle elements in an array, and insert new keys.

## API

The `scramble` command accepts two parameters, the JSON to be scrambled and an optional `options` object:

Every property of `options` is optional and has a default value.

- `options`
  - `chaos` - The amount of scrambling to do. Valid values between `0` and `100` (default: **10**)
  - `canBeNull` - A boolean value that indicates if values can be made null during scrambling (default: **true**)
  - `nullOdds` - Percentage chance between `0` and `100` that a value will be scrambled to `null`. Keep this low unless you want a lot of empty objects (default: **5**)
  - `preservedKeys` - An array of keys (as strings) that should not be scrambled (default: **[]**)
  - `preserveAllKeys` - A boolean value to indicate if all object keys should be preserved (default: **false**)
  - `scrambleStructureOnly` - A boolean value to indicate if keys, strings and numbers should be preserved. Will only mutate the shape of objects and arrays (default: **false**)
  - `wildKeys` - A boolean value to control how readable scrambled object keys should be (default: **false**)
  - `startingPoint` - A [JSONPath]() expression to tell the scrambler where to start scrambling in the document. Useful if you only care about a certain portion of a large document. Still returns the full document (default: **none**)
