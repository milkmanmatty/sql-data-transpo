var tableName = "";
var colNames = [];
var colTypes = [];
var colData = [];

const regexMappings = {
    "int": new RegExp(/([\d]+|NULL)/, "gi"),
    "bit": new RegExp(/([\d]|NULL)/, "gi"),
    "float": new RegExp(/([\d\.]+|NULL)/, "gi"),
    "nvarchar": new RegExp(/([-\w .,:'"?!$%&()<>\\\/]*|NULL)/, "gi"),
    "datetime": new RegExp(/([-\d :.]+|NULL)/, "gi")
};

document.querySelector("button").addEventListener("click", (e) => {
    reset();
    parseMapping();
    parseData();
    formatOutput();
});

const reset = () => {
    tableName = "";
    colNames = [];
    colTypes = [];
    colData = [];
}

const parseMapping = () => {
    const rawData = document.querySelector("#mapping").value;

    try {
        tableName = /INSERT INTO (\[.+\])/.exec(rawData)[0];
    } catch {
        console.error("Could not locate table name :(");
    }

    const strippedJoined = rawData.replaceAll(/(INSERT INTO \[.+\])/g, "")
        .replaceAll(/(\r*\n +)/g, "");

    const mappingParts = strippedJoined.split(')VALUES(');
    colNames = mappingParts[0].substring(1).split(",");

    const hobbledTypes = mappingParts[1].replaceAll(/,>/g,">").trim().split('>,<');
    if(colNames.length !== hobbledTypes.length){
        console.error(`Num colNames (${colNames.length}) not equal to num colTypes (${colTypes.length})`);
        console.log(colNames, colTypes);
        return;
    }

    for(let i in hobbledTypes){
        typeWithLabel = hobbledTypes[i];
        typeWithLabel.split(', ')[1] && colTypes.push(typeWithLabel.split(', ')[1].trim().replace(">)", ""));
    }

    console.log(colNames, colTypes);
}

const parseData = () => {
    const rawData = document.querySelector("#data").value;

    const hasHeader = document.querySelector("input[name='has-header']").checked;
    const hasIdCol = document.querySelector("input[name='has-id']").checked;

    const rows = hasHeader 
        ? rawData.replaceAll(/\r/g, "").split('\n').slice(1)
        : rawData.replaceAll(/\r/g, "").split('\n');

    for(let i in rows){
        hasIdCol
            ? colData.push(rows[i].split("\t").slice(1))
            : colData.push(rows[i].split("\t"));
    }
    for(let r in colData){
        for(let c in colData[r]){
            if(colTypes[c].indexOf("varchar") != -1){
                if(colData[r][c] && colData[r][c] !== "NULL"){
                    colData[r][c] = "'" + colData[r][c].replaceAll("'", "''") + "'";
                    console.log("Sanitized", colData[r][c]);
                } else {
                    colData[r][c] = "''";
                }
            }
            else if(colTypes[c].indexOf("date") != -1){
                if(colData[r][c] && colData[r][c] !== "NULL"){
                    colData[r][c] = "'" + colData[r][c] + "'";
                    console.log("Wrapped", colData[r][c]);
                } else {
                    colData[r][c] = "'2000-01-01 00:00:00.000'";
                }
            }
        }
    }
    console.log(colData);
}

const formatOutput = () => {
    let output = tableName + "(";
    output += colNames.join(',');
    output += ")\nVALUES\n"

    for(let i in colData){
        output += "(";
        output += colData[i].join(',');
        output += i == colData.length-1 
            ? ")" 
            : "),\n";
    }

    document.querySelector("#output").innerHTML = output;
}