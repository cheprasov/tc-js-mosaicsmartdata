
export function add(...items) {
    return items.reduce((prev, curr) => prev + (+curr), 0);
}

export function serialize({total, row}) {
    const result = {total};

    for (let i = 0; i < total; i += 1) {
        const item = row[i];

        result[`row${i}_name`] = item.name;
        result[`row${i}_value`] = item.value;

        if ('hits' in item) {
            const key_hits = `row${i}_hits`;
            result[key_hits] = {};

            const count = item.hits.hit.length;
            for (let i = 0; i < count; i += 1) {
                const timeObj = item.hits.hit[i];
                const key_time = `hit${i}_time`;
                result[key_hits][key_time] = timeObj.time;
            }
        }
    }

    return result;
}

const getDateByTimestamp = (time) => {
    const DateTime = new Date(time);
    return (
        DateTime.getDate().toString().padStart(2, '0') + '/' +
        (DateTime.getMonth() + 1).toString().padStart(2, '0') + '/' +
        DateTime.getFullYear()
    );
};

export function deserialize(object) {
    const total = object.total || 0;

    const result = {
        row: [],
        total,
    };

    for (let i = 0; i < total; i += 1) {
        const key_name = `row${i}_name`;
        const key_value = `row${i}_value`;
        const key_hits = `row${i}_hits`;

        const row = {
            name: object[key_name],
            value: object[key_value],
        };

        if (key_hits in object) {
            const hits = object[key_hits];
            row.hits = row.hits || {hit:[]};
            const hit = row.hits.hit;

            for (let i = 0; true; i += 1) {
                const key_time = `hit${i}_time`;
                if (!(key_time in hits)) {
                    break
                }
                hit.push({time: getDateByTimestamp(+hits[key_time].slice(2))});
            }
        }

        result.row.push(row);
    }

    return result;
}

const copyVar = (variable) => {
    const type = typeof variable;
    if (type === 'string' || type === 'number' || type === 'boolean' || variable === null) {
        return variable;
    }
    if (type === 'function') {
        return new Function('return ' + variable.toString())();
    }
    // Hm... I do not want to copy via JSON.parse(JSON.stringify(variable))
    if (Array.isArray(variable)) {
        const copiedArray = [];
        // cant use .map() here
        for (let item of variable) {
            copiedArray.push(copyVar(item));
        }
        return copiedArray;
    }
    if (type === 'object') {
        const copiedObject = {};
        for (let prop in variable) {
            if (!variable.hasOwnProperty(prop)) {
                continue;
            }
            copiedObject[prop] = copyVar(variable[prop]);
        }
        return copiedObject;
    }
    // I think, base variables are enough
    return undefined;
};

export function listToObject(array) {
    if (!Array.isArray(array)) {
        throw new Error('InvalidArgument: expected Array, actual ' + typeof (array));
    }
    const result = {};
    for (let item of array) {
        result[item.name] = copyVar(item.value);
    }
    return result;
}

export function objectToList(object) {
    if (typeof(object) !== 'object' || !object) {
        throw new Error('InvalidArgument: expect object');
    }
    const result = [];
    for (let prop in object) {
        if (!object.hasOwnProperty(prop)) {
            continue;
        }
        result.push({name: prop, value: copyVar(object[prop])});
    }
    return result;
}
