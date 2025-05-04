import randomstring from "randomstring";
import jp from "jsonpath";
import { z } from "zod";

type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

/**
 * Options for configuring the JSON scrambler behavior
 */
export type ScramblerOptions = {
  /** The amount of scrambling to do. Valid values between 0 and 100 (default: 10) */
  chaos?: number;
  /** Indicates if values can be made null during scrambling (default: true) */
  canBeNull?: boolean;
  /** Percentage chance between 0 and 100 that a value will be scrambled to null (default: 5) */
  nullOdds?: number;
  /** An array of keys that should not be scrambled (default: []) */
  preservedKeys?: string[];
  /** Indicates if all object keys should be preserved (default: false) */
  preserveAllKeys?: boolean;
  /** Indicates if the original shape of the object should be preserved (default: false) */
  preserveShape?: boolean;
  /** Controls how readable scrambled object keys will be (default: false) */
  wildKeys?: boolean;
  /** A JSONPath expression to indicate where to start scrambling in the document (default: "") */
  startingPoint?: string;
  /** Indicates if keys, strings and numbers should be preserved. Will only mutate the shape of objects and arrays (default: false) */
  scrambleStructureOnly?: boolean;
  /** Indicates if only values (strings and numbers) should be scrambled (default: false) */
  scrambleValuesOnly?: boolean;
  /** The maximum depth to recurse through the JSON structure (default: 30) */
  maxDepth?: number;
  /** When set to true will shuffle key names using existing letters instead of generating new random strings (default: false) */
  shuffleKeys?: boolean;
  /** When set to true will shuffle string values using existing letters instead of generating new random strings (default: false) */
  shuffleStrings?: boolean;
};

/**
 * Zod schema for validating ScramblerOptions
 */
export const ScramblerOptionsSchema = z.object({
  chaos: z.number().min(0).max(100).optional(),
  canBeNull: z.boolean().optional(),
  nullOdds: z.number().min(0).max(100).optional(),
  preservedKeys: z.array(z.string()).optional(),
  preserveAllKeys: z.boolean().optional(),
  preserveShape: z.boolean().optional(),
  wildKeys: z.boolean().optional(),
  startingPoint: z.string().optional(),
  scrambleStructureOnly: z.boolean().optional(),
  scrambleValuesOnly: z.boolean().optional(),
  maxDepth: z.number().positive().optional(),
  shuffleKeys: z.boolean().optional(),
  shuffleStrings: z.boolean().optional(),
});

/**
 * Filters an object to only include valid ScramblerOptions properties
 * @param options Any object that might contain ScramblerOptions properties
 * @returns A clean ScramblerOptions object with only valid properties
 */
export function filterOptions(options: unknown): ScramblerOptions {
  // If not an object at all, return empty options
  if (typeof options !== "object" || options === null) {
    return {};
  }

  const result: ScramblerOptions = {};
  const optionsObj = options as Record<string, unknown>;

  // Get the schema shape to know which properties to check
  const schemaShape = ScramblerOptionsSchema.shape;

  // Process each property defined in the schema
  Object.entries(schemaShape).forEach(([key, validator]) => {
    if (!(key in optionsObj)) return;

    // Validate just this single property
    const singlePropSchema = z.object({ [key]: validator });
    const singlePropResult = singlePropSchema.safeParse({
      [key]: optionsObj[key],
    });

    // If valid, add it to the result
    if (singlePropResult.success) {
      (result as any)[key] = optionsObj[key];
    }
  });

  return result;
}

class Scrambler {
  heat: number = 10;
  startingOdds: number = 100;

  arrayOperatorOdds = {
    addElement: 25,
    removeElement: 5,
    swapElements: 50,
  };

  arrayOperatorMaximums = {
    addElement: 3,
    removeElement: 2,
    swapElements: 2,
  };

  objectOperatorOdds = {
    addElement: 25,
    removeElement: 5,
  };

  objectOperatorMaximums = {
    addElement: 3,
    removeElement: 2,
  };

  maxStringLengths: number[] = [10, 50, 100, 1000];
  minNumber: number = 0;
  maxNumbers: number[] = [10, 100, 100000, 100000000000];

  maxDepth: number;

  chaos: number;
  canBeNull: boolean;
  maxNulls: number = 5;

  parsed: Object;
  toScramble: Object = {};
  scrambled: Object = {};

  odds: number;

  nullOdds: number;

  asString: boolean;

  wildKeys: boolean;

  preservedKeys: any[];
  preserveAllKeys: boolean;
  preserveShape: boolean;

  shuffleKeys: boolean;
  shuffleStrings: boolean;

  scrambleStructureOnly: boolean;
  scrambleValuesOnly: boolean;

  startingPoint: string;

  constructor(json: any, options: unknown = {}) {
    const validOptions = filterOptions(options);

    this.nullOdds = (validOptions.nullOdds !== undefined)
      ? validOptions.nullOdds
      : 5;
    this.odds = this.startingOdds;
    this.chaos = (validOptions.chaos !== undefined) ? validOptions.chaos : 10;
    this.canBeNull = (validOptions.canBeNull !== undefined)
      ? validOptions.canBeNull
      : true;
    this.wildKeys = validOptions.wildKeys || false;

    this.maxDepth = validOptions.maxDepth || 30;

    this.preservedKeys = validOptions.preservedKeys || [];
    this.preserveAllKeys = validOptions.preserveAllKeys || false;
    this.preserveShape = validOptions.preserveShape || false;

    this.scrambleStructureOnly = validOptions.scrambleStructureOnly || false;
    if (this.scrambleStructureOnly) this.preserveAllKeys = true;

    this.scrambleValuesOnly = validOptions.scrambleValuesOnly || false;
    if (this.scrambleValuesOnly) this.preserveAllKeys = true;

    this.shuffleKeys = validOptions.shuffleKeys || false;
    this.shuffleStrings = validOptions.shuffleStrings || false;

    this.startingPoint = validOptions.startingPoint || "";

    this.parsed = (typeof json === "string") ? JSON.parse(json) : json;

    if (this.startingPoint !== "") {
      this.toScramble = jp.query(this.parsed, this.startingPoint)[0];
    } else {
      this.toScramble = this.parsed;
    }

    this.asString = (typeof json === "string") ? true : false;
  }

  scramble() {
    let doc: any = JSON.parse(JSON.stringify(this.toScramble));

    if (Array.isArray(doc)) {
      doc = this.arrayMutate(doc, false);
    } else if (typeof doc === "object") {
      doc = this.objectMutate(doc, false);
    } else if (typeof doc === "number") {
      doc = this.numberMutate(doc, false);
    } else if (typeof doc === "string") {
      doc = this.stringMutate(doc, false);
    }

    if (this.startingPoint != "") {
      const parsed = JSON.parse(JSON.stringify(this.parsed));
      const result = jp.apply(parsed, this.startingPoint, () => doc);
      this.scrambled = parsed;
    } else {
      this.scrambled = doc;
    }

    return (this.asString) ? JSON.stringify(this.scrambled) : this.scrambled;
  }

  checkNullOdds() {
    const random = Math.floor(Math.random() * 100);
    return random < this.nullOdds;
  }

  doMutation(forceMutation: boolean = false): boolean {
    const random = Math.floor(Math.random() * this.odds);
    if (random < this.chaos || forceMutation) {
      this.odds = this.startingOdds;
      return true;
    } else {
      this.odds = this.odds - Math.floor(this.odds / this.heat);
      return false;
    }
  }

  arrayMutate(
    arr: any[],
    canBeNull: boolean,
    depth: number = 1,
    forceMutation: boolean = false,
  ): Array<any> | null {
    let newArr: any[] = JSON.parse(JSON.stringify(arr));

    if (depth >= this.maxDepth) return newArr;

    let addElement =
      (Math.floor(Math.random() * 100) < this.arrayOperatorOdds.addElement) ||
      forceMutation;
    let removeElement =
      Math.floor(Math.random() * 100) < this.arrayOperatorOdds.removeElement;
    let swapElements =
      Math.floor(Math.random() * 100) < this.arrayOperatorOdds.swapElements;

    for (let i = 0; i < newArr.length; i++) {
      if (Array.isArray(newArr[i])) {
        newArr[i] = JSON.parse(
          JSON.stringify(
            this.arrayMutate(newArr[i], this.canBeNull, depth + 1),
          ),
        );
      } else if (typeof newArr[i] === "object") {
        newArr[i] = JSON.parse(
          JSON.stringify(
            this.objectMutate(newArr[i], this.canBeNull, depth + 1),
          ),
        );
      } else if (typeof newArr[i] === "number") {
        newArr[i] = this.numberMutate(newArr[i], this.canBeNull, depth + 1);
      } else if (typeof newArr[i] === "string") {
        newArr[i] = this.stringMutate(newArr[i], this.canBeNull, depth + 1);
      } else {
        newArr[i] = newArr[i];
      }
    }

    if (this.doMutation(forceMutation) && !this.scrambleValuesOnly) {
      if (removeElement && newArr.length > 0) {
        const numElements =
          Math.floor(Math.random() * this.arrayOperatorMaximums.removeElement) +
          1;
        for (let i = 0; i < numElements; i++) {
          newArr.splice(Math.floor(Math.random() * newArr.length), 1);
        }
      }

      if (addElement) {
        const numElements =
          Math.floor(Math.random() * this.arrayOperatorMaximums.addElement) + 1;
        for (let i = 0; i < numElements; i++) {
          const newEl = this._getRandomElement(true, depth);
          const newIndex = Math.floor(Math.random() * newArr.length);
          newArr.splice(newIndex, 0, newEl);
        }
      }

      if (swapElements && newArr.length > 1) {
        const numElements =
          Math.floor(Math.random() * this.arrayOperatorMaximums.swapElements) +
          1;
        for (let i = 0; i < numElements; i++) {
          let index1 = Math.floor(Math.random() * newArr.length);
          let index2 = Math.floor(Math.random() * newArr.length);
          if (index1 == index2) {
            index2 = (index2 > 0) ? index2-- : index2++;
          }
          const temp = newArr[index1];
          newArr[index1] = newArr[index2];
          newArr[index2] = temp;
        }
      }
    }

    return (canBeNull && this.checkNullOdds()) ? null : newArr;
  }

  objectMutate(
    obj: any,
    canBeNull: boolean,
    depth: number = 1,
    forceMutation: boolean = false,
  ): any | null {
    let newObj = JSON.parse(JSON.stringify(obj));

    if (depth >= this.maxDepth) return newObj;

    let addElement =
      Math.floor(Math.random() * 100) < this.objectOperatorOdds.addElement;
    let removeElement =
      Math.floor(Math.random() * 100) < this.objectOperatorOdds.removeElement;

    const newObjKeys = Object.keys(newObj) as Array<keyof typeof newObj>;

    newObjKeys.forEach((key) => {
      let k = (this.preservedKeys.includes(key) || this.preserveAllKeys)
        ? key
        : (this.doMutation(forceMutation)
          // ? this._generateString(this.wildKeys)
          ? this.keyMutate(key, this.shuffleKeys)
          : key);

      if (Array.isArray(newObj[key])) {
        newObj[k] = JSON.parse(
          JSON.stringify(
            this.arrayMutate(
              newObj[key],
              this.canBeNull,
              depth + 1,
              forceMutation,
            ),
          ),
        );
        if (k !== key) delete newObj[key];
      } else if (typeof newObj[key] === "object") {
        newObj[k] = JSON.parse(
          JSON.stringify(
            this.objectMutate(
              newObj[key],
              this.canBeNull,
              depth + 1,
              forceMutation,
            ),
          ),
        );
        if (k !== key) delete newObj[key];
      } else if (typeof newObj[key] === "number") {
        newObj[k] = this.numberMutate(
          newObj[key],
          this.canBeNull,
          depth + 1,
          forceMutation,
        );
        if (k !== key) delete newObj[key];
      } else if (typeof newObj[key] === "string") {
        newObj[k] = this.stringMutate(
          newObj[key],
          this.canBeNull,
          depth + 1,
          forceMutation,
        );
        if (k !== key) delete newObj[key];
      }
    });

    const currentObjKeys = Object.keys(newObj) as Array<keyof typeof newObj>;

    if (
      this.doMutation(forceMutation) && !this.scrambleValuesOnly &&
      !this.preserveShape
    ) {
      if (removeElement && currentObjKeys.length > 0) {
        const numElements = Math.floor(
          Math.random() * this.objectOperatorMaximums.removeElement,
        ) + 1;
        for (let i = 0; i < numElements; i++) {
          const key =
            currentObjKeys[Math.floor(Math.random() * currentObjKeys.length)];
          delete newObj[key];
        }
      }

      if (addElement) {
        const numElements =
          Math.floor(Math.random() * this.objectOperatorMaximums.addElement) +
          1;
        for (let i = 0; i < numElements; i++) {
          const newKey = this._generateString(this.wildKeys);
          let newVal = this._getRandomElement(true, depth);
          newObj[newKey] = newVal;
        }
      }
    }

    return (canBeNull && this.checkNullOdds()) ? null : newObj;
  }

  keyMutate(
    key: string | number | symbol,
    shuffleOnly: boolean = false,
  ): string | number | symbol {
    if (shuffleOnly) {
      const newKey = this._shuffleString(key.toString());
      return (typeof key === "number") ? parseInt(newKey) : newKey;
    } else {
      return this._generateString(this.wildKeys);
    }
  }

  numberMutate(
    num: number,
    canBeNull: boolean,
    depth: number = 1,
    forceMutation: boolean = false,
  ): number | null {
    if (this.doMutation(forceMutation) && !this.scrambleStructureOnly) {
      return (canBeNull && this.checkNullOdds())
        ? null
        : this._generateNumber();
    }
    return num;
  }

  stringMutate(
    str: string,
    canBeNull: boolean,
    depth: number = 1,
    forceMutation: boolean = false,
  ): string | null {
    let newStr: string | null = str;
    if (this.doMutation(forceMutation) && !this.scrambleStructureOnly) {
      if (this.shuffleStrings) {
        newStr = (canBeNull && this.checkNullOdds())
          ? null
          : this._shuffleString(str);
      } else {
        newStr = (canBeNull && this.checkNullOdds())
          ? null
          : this._generateString();
      }
    }
    return newStr;
  }

  _getRandomElement(includeArrays: boolean = false, depth: number = 1): any {
    const max = (includeArrays && (depth < this.maxDepth)) ? 3 : 2;
    const flip = Math.floor(Math.random() * max);

    switch (flip) {
      case 0:
        return this._generateString();
      case 1:
        return this._generateNumber();
      case 2:
        return this._generateArray(depth);
    }
  }

  _generateArray(depth: number): any[] | null {
    let arr: any[] = [];
    return this.arrayMutate(arr, false, depth * 3, true); // we generate a max of 2 levels deep
  }

  _generateNumber(): number {
    return Math.floor(
      Math.random() *
          this.maxNumbers[Math.floor(Math.random() * this.maxNumbers.length)] -
        this.minNumber,
    ) + this.minNumber;
  }

  _generateString(wild: boolean = true): string {
    const wildChars = wild
      ? ["alphanumeric", " !@#$%^&*()_+{}|:<>?/.,;[]-=\\~`"]
      : ["alphanumeric"];
    const arrLength = wild
      ? this.maxStringLengths.length
      : this.maxStringLengths.length - 2;

    return randomstring.generate({
      // @ts-ignore
      length: Math.floor(
        Math.random() *
          this.maxStringLengths[Math.floor(Math.random() * arrLength)],
      ),
      charset: wildChars,
    });
  }

  _shuffleString(str: string): string {
    return str.split("").sort(() => Math.random() - 0.5).join("");
  }
}

export default function scramble(
  json: string | Object,
  options: unknown = {},
): string | Object {
  return (new Scrambler(json, options)).scramble();
}
