import React from "react";

export function InputSelect(props) {
  const { multiple, required = false, name, value, handleChange, label, prompt, items, enum: enumValues } = props;

  const objectItems = enumValues ? false : true;

  return (
    <div className="form-group">
      <label htmlFor={name}>{label}:</label>
      <select
        id={name}
        required={required}
        className="browser-default form-select"
        multiple={multiple}
        name={name}
        onChange={handleChange}
        value={value}
      >
        {/* Prázdná volba jako výchozí */}
        <option value="" disabled={required}>
          {prompt}
        </option>

        {objectItems
          ? items.map((item, index) => (
              <option key={index + 1} value={item._id}>
                {item.name}
              </option>
            ))
          : items.map((item, index) => (
              <option key={index + 1} value={item}>
                {enumValues[item]}
              </option>
            ))}
      </select>
    </div>
  );
}

export default InputSelect;