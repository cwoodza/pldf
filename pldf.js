/*------------------------------------ pldf 0.3.0 ------------------------------------*/

/* --------------- 1. User defaults ---------------- */

defaultSpec = {
    "height":"auto",
    "width":"100%",
    "maxrows":10
}

/* --------------- 2. PolicyLab DataFrame ---------------- */
class pldf {
    constructor(data, render=null, render_spec=defaultSpec) {
        this.data = data;
        this.renderid = render;
        this.renderspec = render_spec;

        if (render !== null){
            this.render = new pldt(data, render, render_spec);
        } else {
            this.render = null;
        }
    }
      
    arrange(whichcol, direction="desc"){
        // 1. Build ref array
        let getRefArray = [];
        for (let i = 0; i < this.data[whichcol].length; i++) {
            let indexed = {
                "value":this.data[whichcol][i],
                "index":i
            }
            getRefArray.push(indexed);
        }

        // 2. Sort and split ref array
        let getRefIndex = [];
        if(direction === "ascn"){
            getRefArray.sort((a, b) => (a.value > b.value) ? 1 : -1);
        } else if (direction === "desc") {
            getRefArray.sort((a, b) => (a.value < b.value) ? 1 : -1);
        }
        for (let i = 0; i < getRefArray.length; i++) {
            getRefIndex.push(getRefArray[i]["index"]);
        }

        // 3. Arrange all arrays with new order
        let headers = Object.keys(this.data);
        for (let i = 0; i < headers.length; i++) {
            let unsorted = this.data[headers[i]];
            let sorted = [];
            for (let j = 0; j < getRefIndex.length; j++) {
                sorted.push(unsorted[getRefIndex[j]]);
            }
            this.data[headers[i]] = sorted;
        }

        // 4. Complete and render if selected
        this.update();
    }

    bind(otherdf){
        let curHeaders = Object.keys(this.data);
        for (let i = 0; i < curHeaders.length; i++) {
            this.data[curHeaders[i]] = this.data[curHeaders[i]].concat(otherdf.data[curHeaders[i]]);
        }
        this.update();
    }

    filter(whichcol, filterval){
        let headers = Object.keys(this.data);
        let colvals = this.data[whichcol];
        let remove = [];
        for (let i = 0; i < colvals.length; i++) {
            if (colvals[i] !== filterval){
                remove.push(i);
            }
        }
        for (let i = (remove.length - 1); i >= 0; i--) {
            for (let j = 0; j < headers.length; j++) {
                this.data[headers[j]].splice(remove[i],1);
            }
        }
        this.update();
    }

    filterFn(col1, col2, filfn){
        let headers = Object.keys(this.data);
        let colvals = this.data[col1];
        let remove = [];
        for (let i = 0; i < colvals.length; i++) {
            if (filfn(colvals[i], this.data[col2][i])){
                remove.push(i);
            }
        }
        for (let i = (remove.length - 1); i >= 0; i--) {
            for (let j = 0; j < headers.length; j++) {
                this.data[headers[j]].splice(remove[i],1);
            }
        }
        this.update();
    }

    filterGt(whichcol, filterval){
        let headers = Object.keys(this.data);
        let colvals = this.data[whichcol];
        let remove = [];
        for (let i = 0; i < colvals.length; i++) {
            if (colvals[i] < filterval){
                remove.push(i);
            }
        }
        for (let i = (remove.length - 1); i >= 0; i--) {
            for (let j = 0; j < headers.length; j++) {
                this.data[headers[j]].splice(remove[i],1);
            }
        }
        this.update();
    }

    filterLt(whichcol, filterval){
        let headers = Object.keys(this.data);
        let colvals = this.data[whichcol];
        let remove = [];
        for (let i = 0; i < colvals.length; i++) {
            if (colvals[i] > filterval){
                remove.push(i);
            }
        }
        for (let i = (remove.length - 1); i >= 0; i--) {
            for (let j = 0; j < headers.length; j++) {
                this.data[headers[j]].splice(remove[i],1);
            }
        }
        this.update();
    }
 
    merge(otherdf, whichx, whichy, keepy=false){
        // 1. Prepare data for sorting
        let headers = Object.keys(this.data);
        let otherheaders = Object.keys(otherdf.data);
        let namelookup = {};
        for (let i = 0; i < otherheaders.length; i++) {
            if(otherheaders[i] !== whichy){
                let mergename = safeName(otherheaders[i], headers);
                this.data[mergename] = [];
                namelookup[otherheaders[i]] = mergename;
            }
        }

        // 2. Sort
        let whichxcol = this.data[whichx];
        for (let i = 0; i < whichxcol.length; i++) {
            let sorti = otherdf.data[whichy].indexOf(whichxcol[i]);
            for (let y = 0; y < otherheaders.length; y++) {
                if(otherheaders[y] !== whichy){
                    let newname = namelookup[otherheaders[y]];
                    this.data[newname].push(otherdf.data[otherheaders[y]][sorti])
                }
            }
        }

        // 3. If selected, add in the unmatched values contained in the otherdf
        if(keepy){
            for (let i = 0; i < otherdf.data[whichy].length; i++) {
                if(!whichxcol.includes(otherdf.data[whichy][i])){
                    for (let y = 0; y < otherheaders.length; y++) {
                        if(otherheaders[y] !== whichy){
                            let newname = namelookup[otherheaders[y]];
                            this.data[newname].push(otherdf.data[otherheaders[y]][i])
                        }
                    }
                    for (let x = 0; x < headers.length; x++) {
                        if(headers[x] === whichx){
                            this.data[whichx].push(otherdf.data[whichy][i]);
                        } else {
                            this.data[headers[x]].push(undefined);
                        }
                    }
                }
            }
        }

        // 4. Complete and render if selected
        this.update();
    }

    mutate(otherdf){
        let curHeaders = Object.keys(this.data);
        let addHeaders = Object.keys(otherdf.data);
        for (let i = 0; i < addHeaders.length; i++) {
            let colname = safeName(addHeaders[i], curHeaders);
            this.data[colname] = otherdf.data[addHeaders[i]];
        }
        this.update();
    }

    mutateFn(newname, col1, col2, mutfn){
        this.data[newname] = [];
        for (let i = 0; i < this.data[col1].length; i++) {
            this.data[newname].push(mutfn(this.data[col1][i], this.data[col2][i]));           
        }
        this.update();
    }

    mutateAv(newname, col1, col2){
        this.data[newname] = [];
        for (let i = 0; i < this.data[col1].length; i++) {
            if(this.data[col1][i] === undefined){
                this.data[newname].push(this.data[col2][i]);
            } else if (this.data[col2][i] === undefined){
                this.data[newname].push(this.data[col1][i]);
            } else {
                let newval = (this.data[col1][i] + this.data[col2][i])/2;
                this.data[newname].push(newval);
            }            
        }
        this.update();
    }

    mutateSm(newname, col1, col2){
        this.data[newname] = [];
        for (let i = 0; i < this.data[col1].length; i++) {
            if(this.data[col1][i] === undefined){
                this.data[newname].push(this.data[col2][i]);
            } else if (this.data[col2][i] === undefined){
                this.data[newname].push(this.data[col1][i]);
            } else {
                let newval = (this.data[col1][i] + this.data[col2][i]);
                this.data[newname].push(newval);
            }            
        }
        this.update();
    }

    mutateDf(newname, col1, col2){
        this.data[newname] = [];
        for (let i = 0; i < this.data[col1].length; i++) {
            if(this.data[col1][i] === undefined || this.data[col2][i] === undefined){
                this.data[newname].push(undefined);
            } else {
                let newval = (this.data[col1][i] - this.data[col2][i]);
                this.data[newname].push(newval);
            }            
        }
        this.update();
    }

    mutateDv(newname, col1, col2){
        this.data[newname] = [];
        for (let i = 0; i < this.data[col1].length; i++) {
            if(this.data[col1][i] === undefined){
                this.data[newname].push(0);
            } else if (this.data[col2][i] === undefined){
                this.data[newname].push(undefined);
            } else {
                let newval = this.data[col1][i]/this.data[col2][i];
                this.data[newname].push(newval);
            }            
        }
        this.update();
    }

    mutateTx(newname, idtext){
        let curHeaders = Object.keys(this.data);
        this.data[newname] = [];
        for (let i = 0; i < this.data[curHeaders[0]].length; i++) {
             this.data[newname].push(idtext);
        }
        this.update();
    }

    mutateRn(newname, col1){
        this.arrange(col1);
        this.data[newname] = [...Array(this.data[col1].length).keys()];
        this.update();
    }

    remove(arrayofcols){
        for (let i = 0; i < arrayofcols.length; i++) {
            if(arrayofcols[i] in this.data){
                delete this.data[arrayofcols[i]];
            }
            this.update();
        }
    }

    rename(curname, newname){
        if(curname in this.data){
            this.data[newname] = this.data[curname];
            delete this.data[curname];
            this.update();
        }
    }

    renameAll(curarray, newarray){
        for (let i = 0; i < curarray.length; i++) {
            if(curarray[i] in this.data && newarray[i] !== curarray[i]){
                this.data[newarray[i]] = this.data[curarray[i]];
                delete this.data[curarray[i]];
            }
        }
        this.update();
    }

    replace(whichcol, find, replace){
        for (let i = 0; i < this.data[whichcol].length; i++) {
            if(this.data[whichcol][i] === find){
                this.data[whichcol][i] = replace
            }
        }
        this.update();
    }

    replaceNulls(whichcol, replace){
        for (let i = 0; i < this.data[whichcol].length; i++) {
            if(this.data[whichcol][i] === undefined || this.data[whichcol][i] === null){
                this.data[whichcol][i] = replace
            }
        }
        this.update();
    }

    select(arrayofcols){
        let newdata = {};
        for (let i = 0; i < arrayofcols.length; i++) {
            newdata[arrayofcols[i]] = this.data[arrayofcols[i]]
        }
        this.data = newdata;
        this.update();
    }

    slice(minrow, maxrow){
        let headers = Object.keys(this.data);
        for (let i = 0; i < headers.length; i++) {
            this.data[headers[i]] = this.data[headers[i]].slice(minrow-1, maxrow);
        }
        this.update();
    }

    summarise(groupby, whichcol, summarise){
        // 1. Create evaluation array that is comparable
        let evalgroups = [];
        let summgroups = [];
        let summvalues = [];
        
        for (let i = 0; i < this.data[whichcol].length; i++) {
            let evalstruct = {};
            for (let j = 0; j < groupby.length; j++) {
                evalstruct[groupby[j]] = this.data[groupby[j]][i];
            }
            evalgroups.push(evalstruct);
        }

        // 2. Find duplicates, iterating values where struct already exists
        for (let i = 0; i < evalgroups.length; i++) {
            let sorti = indexObj(evalgroups[i], summgroups);
            if(sorti === -1){ // groupby cluster hasn't been added yet
                summgroups.push(evalgroups[i]);
                if(summarise === "count"){
                    summvalues.push(1);
                } else {
                    summvalues.push(this.data[whichcol][i]);
                }
            } else { // groupby cluster has been added
                if(summarise === "count"){
                    summvalues[sorti] += 1;
                } else if(summarise === "sum") {
                    summvalues[sorti] += this.data[whichcol][i];
                } else if(summarise === "mean"){
                    let aveval = (summvalues[sorti] + this.data[whichcol][i])/2;
                    summvalues[sorti] = aveval;
                }
            }
        }

        // 3. Rebuild data structure
        let rebuild = {};
        let headers = Object.keys(this.data);
        for (let i = 0; i < headers.length; i++) {
            if(headers[i] === whichcol){
                rebuild[summarise + "_" + headers[i]] = summvalues;
            } else if(groupby.includes(headers[i])) {
                let newarray = [];
                for (let j = 0; j < summgroups.length; j++) {
                    newarray.push(summgroups[j][headers[i]])
                }
                rebuild[headers[i]] = newarray;
            }
        }
        this.data = rebuild;

        // 4. Complete and render if selected
        if (this.render != null){
            this.render.update(this.data);
        }
    }

    widen(ref, names, values, sort=null){
        // Get unique values from the ref column
        let rebuild = {};
        let uq_cols = [];
        for (let i = 0; i < this.data[ref].length; i++) {
            if(!(this.data[ref][i] in rebuild)){
                rebuild[this.data[ref][i]] = {};
                if(sort !== null){
                    rebuild[this.data[ref][i]][sort] = this.data[sort][i];
                }
            }
            if(!(uq_cols.includes(this.data[names][i]))){
                uq_cols.push(this.data[names][i]);
            }
        }

        // Allocate names and values
        for (let i = 0; i < this.data[values].length; i++) {
            rebuild[this.data[ref][i]][this.data[names][i]] = this.data[values][i];
        }

        // Build the new structure
        let restructure = {};
        restructure[ref] = [];
        if(sort !== null){
            restructure[sort] = [];
        }
        for (let i = 0; i < uq_cols.length; i++) {
            restructure[uq_cols[i]] = [];
        }

        // Restructure to pldf standard format
        let refkeys = Object.keys(rebuild);
        for (let i = 0; i < refkeys.length; i++) {
            restructure[ref].push(refkeys[i]);
            if(sort !== null){
                restructure[sort].push(rebuild[refkeys[i]][sort]);
            }
            for (let j = 0; j < uq_cols.length; j++) {
                if(uq_cols[j] in rebuild[refkeys[i]]){
                    restructure[uq_cols[j]].push(rebuild[refkeys[i]][uq_cols[j]]);
                } else {
                    restructure[uq_cols[j]].push(0);
                }
            }
        }

        // Update data and finish
        this.data = restructure;
        this.update();
    }

    clone(renderid=null){
        let deepclone = structuredClone(this)
        return (new pldf(deepclone.data, renderid, deepclone.renderspec))
    }

    toCSV(filename="pldf_download.csv"){
        // Prepare csv_lines array with headers
        let Headers = Object.keys(this.data);
        let header_line = Headers.map(function(e){
            return JSON.stringify(e);
        });
        let csv_lines = [header_line.join(";")];

        // Restructure to arrays as rows rather than cols
        for (let i = 0; i < this.data[Headers[0]].length; i++) {
            let df_line = []
            for (let j = 0; j < Headers.length; j++) {
                let base = this.data[Headers[j]][i];
                let clean = base;
                if (typeof base === 'string'){
                    clean = base.replaceAll(';', ' -');
                }
                df_line.push(clean);
            }
            let string_array = df_line.map(function(e){
                return JSON.stringify(e);
            });
            let csv_line = string_array.join(";");
            csv_lines.push(csv_line);
        }
        let output_data = csv_lines.join("\r\n");
        
        // Create file and trigger save window
        const output_file = new File([output_data], filename, {
            type: "text/csv",
          });
        let exp = document.createElement("a");
        exp.href = URL.createObjectURL(output_file);
        exp.download = filename;
        document.body.appendChild(exp);
        exp.click();
        exp.remove();
    }

    update(){
        if (this.render != null){
            this.render.update(this.data);
        }
    }
}

/* --------------- 3. PolicyLabdf Table ---------------- */

class pldt {
    constructor(data, holder, spec) {
        this.data = data;
        let rendered = this.renderTable(data, spec);
        this.render = rendered;
        let getHeaders = Object.keys(data);
        let getEndRow = data[getHeaders[0]].length - 1;
        if(data[getHeaders[0]].length > spec["maxrows"]){
            let controlrender = this.renderControl(getHeaders.length, getEndRow, spec);
            this.control = controlrender;
            rendered.append(controlrender);
        }
        this.holder = holder;
        this.spec = spec;
        this.toprow = 0;
        this.endrow = getEndRow;
        holder.append(rendered);
    }

    renderTable(data, spec) {
        let table = document.createElement("table");
        table.className = "pldt";
        table.style.height = spec["height"];
        table.style.width = spec["width"];

        let getHeaders = Object.keys(data);
        let table_headers = document.createElement("tr");
        for (let i = 0; i < getHeaders.length; i++) {
            let new_header = document.createElement("th");
            new_header.innerText = getHeaders[i];
            table_headers.append(new_header);
        }
        table.append(table_headers);

        let dflen = data[getHeaders[0]].length;
        if(dflen > spec["maxrows"]){
            dflen = spec["maxrows"];
        }
        for (let i = 0; i < dflen; i++) { // i are rows
            let new_row = document.createElement("tr");
            new_row.className = "pldt_row";
            for (let j = 0; j < getHeaders.length; j++) { // j are cols
                let datapoint = data[getHeaders[j]][i];
                let new_dpoint = document.createElement("td");
                new_dpoint.innerText = datapoint;
                new_row.append(new_dpoint);
            }
            table.append(new_row);
        }

        return table;
    }

    renderControl(span, endrow, spec){
        let control_row = document.createElement("tr");
        control_row.className = "ControlRow";
        this.control = control_row;
        let control_row_content = document.createElement("td");
        control_row_content.colSpan = span;

        let prev_button = document.createElement("button");
        prev_button.innerText = "Previous";
        prev_button.className = "ControlButton";
        prev_button.addEventListener('click', () => {
            this.scrollPage(0);
        });
        control_row_content.append(prev_button);

        let page_button_holder = document.createElement("div"); // To manage overflow of num buttons
        page_button_holder.className = "ControlButtonHolder";
        let pages = Math.round((endrow+1)/spec["maxrows"]);
        for (let i = 0; i < pages; i++) {
            let page_button = document.createElement("button");
            page_button.className = "ControlButton";
            page_button.innerText = (i+1);
            page_button.value = i*spec["maxrows"];
            page_button.addEventListener('click', (e) => {
                this.toPage(e.target.value);
            });
            page_button_holder.append(page_button);
        }
        control_row_content.append(page_button_holder);

        let next_button = document.createElement("button");
        next_button.innerText = "Next";
        next_button.className = "ControlButton";
        next_button.addEventListener('click', () => {
            this.scrollPage(1);
        });
        control_row_content.append(next_button);
        
        control_row.append(control_row_content);
        return control_row
    }
    
    update(newdata){
        this.data = newdata;
        this.render.remove();
        this.render = this.renderTable(newdata, this.spec);
        let getHeaders = Object.keys(this.data);
        let getEndRow = this.data[getHeaders[0]].length - 1;
        if(this.data[getHeaders[0]].length > this.spec["maxrows"]){
            let controlrender = this.renderControl(getHeaders.length, getEndRow, this.spec);
            this.control = controlrender;
            this.render.append(controlrender);
        }
        this.toprow = 0;
        this.endrow = getEndRow;
        this.holder.append(this.render);
    }

    scrollPage(direction){ // 0 is left, 1 is right
        let whichtoprow;
        if(direction === 0){
            whichtoprow = this.toprow - this.spec["maxrows"];
        } else {
            whichtoprow = this.toprow + this.spec["maxrows"];
        }
        if(whichtoprow < (this.endrow + 1) && whichtoprow > -1){
            this.toPage(whichtoprow);
        }
    }

    toPage(whichTopRow){
        // 1. Remove old rows
        let rows = this.render.getElementsByClassName("pldt_row");
        for (var i = rows.length - 1; i >= 0; --i) {
            rows[i].remove();
        }

        // 2. Append new rows
        let getHeaders = Object.keys(this.data);
        let dflen = this.data[getHeaders[0]].length;
        let whichBottomRow = whichTopRow + this.spec["maxrows"];
        if(dflen > whichBottomRow){
            dflen = whichBottomRow;
        }
        for (let i = whichTopRow; i < dflen; i++) { // i are rows
            let new_row = document.createElement("tr");
            new_row.className = "pldt_row";
            for (let j = 0; j < getHeaders.length; j++) { // j are cols
                let datapoint = this.data[getHeaders[j]][i];
                let new_dpoint = document.createElement("td");
                new_dpoint.innerText = datapoint;
                new_row.append(new_dpoint);
            }
            this.render.insertBefore(new_row, this.control);
        }

        // 3. Update state
        this.toprow = whichTopRow;
    }
}

/* --------------- 4. Utility functions ---------------- */

function safeName(whichname, whicharray){
    let curname = whichname;
    let curcount = 0;
    while (whicharray.includes(curname)) {
        curcount += 1;
        curname = whichname + curcount;
    }
    return curname;
}

function objEqual(obj1, obj2){
    let equal = true;
    let headers = Object.keys(obj1);
    for (let k = 0; k < headers.length; k++) { 
        if(obj1[headers[k]] !== obj2[headers[k]]){
            equal = false;
            break
        }
    }
    return equal
}

function indexObj(whichobj, whicharray){
    let returni = -1;
    for (let l = 0; l < whicharray.length; l++) { 
        if(objEqual(whichobj, whicharray[l])){
            returni = l;
            break
        }
    }
    return returni
}

/* --------------- 5. Data prep functions ---------------- */

function prep_JSONarray(jsonarray, whichkeys=null){
    let restructured = {};
    if(whichkeys === null){
        whichkeys = Object.keys(jsonarray[0]);
    }
    for (let i = 0; i < whichkeys.length; i++) {
        restructured[whichkeys[i]] = [];
    }

    for (let i = 0; i < jsonarray.length; i++) {
        for (let j = 0; j < whichkeys.length; j++) {
            restructured[whichkeys[j]].push(jsonarray[i][whichkeys[j]])
        }
    }
    return restructured
}

function prep_NamedObjects(original){
    let namekeys = Object.keys(original);
    let objkeys = Object.keys(original[namekeys[0]]);

    let restructured = {};
    for (let i = 0; i < objkeys.length; i++) {
        restructured[objkeys[i]] = [];
    }

    for (let i = 0; i < namekeys.length; i++) {
        for (let j = 0; j < objkeys.length; j++) {
            restructured[objkeys[j]].push(original[namekeys[i]][objkeys[j]]);
        }
    }

    return restructured
}
