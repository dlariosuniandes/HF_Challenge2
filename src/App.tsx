import React, { useEffect, useState } from "react";
import "./App.css";

// Types

interface BasePositionParams {
  keyName: string[];
  deep: number;
  isLastIndex: boolean;
}

type WrapperPositionProps = BasePositionParams;

interface ValuePositionProps extends BasePositionParams {
  value: unknown;
  setIndex: (index: string) => void;
}

interface ProcessValueParams extends BasePositionParams {
  value: unknown;
  parentKey: string[];
  RenderElement: (props: ValuePositionProps) => JSX.Element;
  setIndex: (index: string) => void;
}

interface ProcessObjectParams extends Partial<BasePositionParams> {
  setIndex: (index: string) => void;
}

// Utils

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isArray(value: unknown): value is Array<unknown> {
  return Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

const numberRegEx = RegExp(/^\d{1,10}$/);

const getIndexFromKey = (keys: string[]): string => {
  return keys.reduce((acc, key, index) => {
    const isNumber = numberRegEx.test(key);
    if (isNumber) {
      return `${acc}[${key}]`;
    } else {
      return index === 0 ? `${key}` : `${acc}.${key}`;
    }
  }, "");
};

const getIndexValueFromObject = (index: string, object: unknown): string => {
  const setOfKeys = index.match(/([^[\].]+)/g);
  const result =
    setOfKeys &&
    setOfKeys.reduce((acc, key) => {
      if (acc && typeof acc === "object" && key in acc) {
        return acc[key as keyof typeof acc];
      }
      return undefined;
    }, object);
  if (isArray(result) || isObject(result)) {
    return "";
  }
  return isString(result) ? `"${String(result)}"` : String(result);
};

//Components

const ValueObjectElement = (props: ValuePositionProps) => {
  const primaryKey = props.keyName && props.keyName[props.keyName.length - 1];
  const uniqueKey = props.keyName.join(".");
  const isStringValue = isString(props.value);

  return (
    <div key={uniqueKey}>
      <span
        onClick={() => props.setIndex(getIndexFromKey(props.keyName))}
        className="object-element-key"
      >{`${primaryKey}`}</span>
      <span>{`: `}</span>
      {isStringValue && <span>"</span>}
      <span className="object-element-value">{`${String(props.value)}`}</span>
      {isStringValue && <span>"</span>}
      {!props.isLastIndex && <span>{","}</span>}
    </div>
  );
};

const ValueArrayElement = (props: ValuePositionProps) => {
  const uniqueKey = props.keyName.join(".");
  const isStringValue = isString(props.value);
  return (
    <div key={uniqueKey}>
      {isStringValue && <span>"</span>}
      {`${String(props.value)}`}
      {isStringValue && <span>"</span>}
      {!props.isLastIndex && <span>{","}</span>}
    </div>
  );
};

const ArrayWrapper = (
  props: WrapperPositionProps & { children: React.ReactNode }
) => {
  const primaryKey = props.keyName && props.keyName[props.keyName.length - 1];
  const uniqueKey = props.keyName.join(".");
  const shoulDisplayComma = !props.isLastIndex;

  return (
    <div key={uniqueKey} className="element-wrapper">
      <div>
        {`${primaryKey}: `}
        {`[`}
      </div>

      <div
        className={"element-div"}
        style={{ marginLeft: (props.deep + 2) * 20 }}
      >
        {props.children}
      </div>

      <div>
        {`]`}
        {shoulDisplayComma && <span>{","}</span>}
      </div>
    </div>
  );
};

const ObjectWrapper = (
  props: WrapperPositionProps & { children: React.ReactNode }
) => {
  const primaryKey = props.keyName && props.keyName[props.keyName.length - 1];
  const uniqueKey = props.keyName.join(".");
  const shouldDisplayPrimaryKey =
    primaryKey && !numberRegEx.test(primaryKey) && props.keyName.length > 1;
  const shouldDisplayMainBracket = props.deep > 0;
  const shoulDisplayComma = !props.isLastIndex;

  return (
    <div key={uniqueKey} className="element-wrapper">
      {shouldDisplayPrimaryKey && <div>{`${primaryKey}: `}</div>}
      {shouldDisplayMainBracket && <div>{`{`}</div>}
      <div
        className={"element-div"}
        style={{ marginLeft: (props.deep + 1) * 20 }}
      >
        {props.children}
      </div>
      <div>
        {shouldDisplayMainBracket && "}"}
        {shoulDisplayComma && <span>{","}</span>}
      </div>
    </div>
  );
};

interface JsonParserProps {
  json: unknown;
  setIndex: (index: string) => void;
}
const JsonParser = (props: JsonParserProps): JSX.Element => {
  const processValue = ({
    value,
    parentKey,
    keyName,
    RenderElement,
    ...rest
  }: ProcessValueParams): React.ReactNode => {
    const composedKey = parentKey?.concat(keyName) || keyName;
    if (isArray(value)) {
      return processObject(value, {
        keyName: composedKey,
        ...rest,
      });
    }
    if (isObject(value)) {
      return processObject(value, {
        keyName: composedKey,
        ...rest,
      });
    } else {
      return (
        <RenderElement
          setIndex={rest.setIndex}
          key={composedKey.join(".")}
          isLastIndex={rest.isLastIndex}
          deep={rest.deep}
          keyName={composedKey}
          value={value}
        />
      );
    }
  };

  const processObject = (
    jsonObj: unknown,
    {
      keyName = [],
      deep = 0,
      isLastIndex = true,
      setIndex,
    }: ProcessObjectParams
  ): React.ReactNode => {
    if (isArray(jsonObj)) {
      return (
        <ArrayWrapper isLastIndex={isLastIndex} deep={deep} keyName={keyName}>
          {jsonObj.map((value, index) => {
            const isLastIndex = index === jsonObj.length - 1;
            const arrayKey = [...keyName, String(index)].join(".");
            return (
              <div key={arrayKey}>
                {processValue({
                  RenderElement: ValueArrayElement,
                  value,
                  parentKey: keyName,
                  keyName: [String(index)],
                  deep,
                  isLastIndex,
                  setIndex,
                })}
              </div>
            );
          })}
        </ArrayWrapper>
      );
    } else if (isObject(jsonObj)) {
      return (
        <ObjectWrapper isLastIndex={isLastIndex} deep={deep} keyName={keyName}>
          {Object.keys(jsonObj).map((key, index) => {
            const isLastIndex = index === Object.keys(jsonObj).length - 1;
            const objectKey = [...keyName, key].join(".");
            return (
              <div key={objectKey}>
                {processValue({
                  RenderElement: ValueObjectElement,
                  value: jsonObj[key],
                  parentKey: keyName,
                  keyName: [key],
                  deep: deep + 1,
                  isLastIndex,
                  setIndex,
                })}
              </div>
            );
          })}
        </ObjectWrapper>
      );
    }
  };

  return <>{processObject(props.json, { setIndex: props.setIndex })}</>;
};

// Test Data

const test = {
  res: {
    date: "2021-10-27T07:49:14.896Z",
    hasError: false,
    fields: [
      {
        id: "4c212130",
        prop: "iban",
        value: "DE81200505501265402568",
        hasError: false,
      },
    ],
  },
};

// Main App

function App() {
  const [index, setIndex] = useState<string>("");
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    if (index) {
      const resultValue = getIndexValueFromObject(index, test);
      setValue(resultValue);
    } else setValue("");
  }, [index]);
  return (
    <div className="App">
      <div id="form-container">
        <div id="value-input-container">
          <label htmlFor="key-json-form">Property</label>
          <input
            id="key-json-form"
            value={index}
            onChange={(e) => setIndex(e.target.value)}
          />
          <div>{value}</div>
        </div>
        <div id="value-input-container">
          <label htmlFor="fix-json-form">Block / Variable</label>
          <input id="fix-json-form" />
        </div>
      </div>
      <div id={"text-area-container"}>
        <div>Response</div>
        <div id="json-container">
          <JsonParser setIndex={setIndex} json={test} />
        </div>
      </div>
    </div>
  );
}

export default App;
