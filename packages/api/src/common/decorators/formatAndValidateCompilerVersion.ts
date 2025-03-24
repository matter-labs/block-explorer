import { registerDecorator, ValidationOptions } from "class-validator";
export function FormatAndValidateCompilerVersion(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: "formatAndValidateCompilerVersion",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return value && typeof value === "string";
        },
      },
    });
    // Custom setter to format the value
    Object.defineProperty(object, propertyName, {
      set(value: string) {
        const regex = /^(0\.\d+\.\d+(\.\d+)?|zkVM-\d+\.\d+\.\d+(\.\d+)?-\d+\.\d+\.\d+(\.\d+)?)$/;
        if (value && !regex.test(value)) {
          let [major, minor, patch] = value.split(".");
          major = major.slice(1);
          patch = patch.replace(/\+.*$/, "");
          minor = minor;
          const formattedValue = `${major}.${minor}.${patch}`;
          Object.defineProperty(object, `_${propertyName}`, {
            value: formattedValue,
            writable: true,
            configurable: true,
          });
        } else {
          Object.defineProperty(object, `_${propertyName}`, {
            value: value,
            writable: true,
            configurable: true,
          });
        }
      },
      get() {
        return this[`_${propertyName}`];
      },
    });
  };
}
