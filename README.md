# pldf

## Overview
 pldf is a framework for working with JavaScript objects as if they were DataFrames. The pldf class allows data to be manipulated through a range of functions similar to dplyr verbs, which simplifies a number of common data processing tasks. Details of all available functions can be found below.

 pldf includes built-in support for rendering and updating data in interactive HTML tables, called pldt. However this function is not yet fully implemented and should not be used outside of testing. 

##### Table of Contents 
1. [Overview](#overview)
2. [Getting started](#getting-started)
3. [pldf functions](#pldf-functions)
    1. [arrange](#arrange)
    2. [bind](#bind)
    3. [filter](#filter)
    4. [merge](#merge)
    5. [mutate](#mutate)
    6. [remove](#remove)
    7. [rename](#rename)
    8. [replace](#replace)
    9. [select](#select)
    10. [slice](#slice)
    11. [summarise](#summarise)
4. [pldt functions](#pldt-functions)
5. [Helper functions](#helper-functions)

## Getting started

A new pldf can be created by passing suitably prepared data to a new instance of the pldf class. pldf expects data to be structured as a JavaScript Object populated with arrays. Object keys are used as column headers, arrays are used to populate each column, and array indexes are used as row numbers. 

```js
let mydata = {
    "col1":[1, 2, 3, 4, 5],
    "col2":["one", "two", "three", "four", "five"],
    "col3":[true, true, false, false, false]
}

let mydf = new pldf(mydata)
```

pldf will accept any type of value that can be stored in a JavaScript Object, including functions or other Objects. However, pldf functions are only able to evaluate strings, numbers and Booleans. 

For users looking to include a pldt data table, an optional second argument accepts an HTML ID reference, which indicates where the table should be rendered. An optional third element allows users to control how the pldt renders, however it is generally recommended to rather make these edits by changing the ```defaultSpec``` object at the top of the pldf.js script.

```js
let mydf = new pldf(mydata, "myid", myspec)
```

Any changes made to a pldf Object will overwrite the data passed to the Object. For this reason, if you want to keep your original DataFrame, you should use the ```clone()``` command to create a new instance of the DataFrame.

```js
let df_copy = mydf.clone()
```

The content of the pldf can be exported to CSV using the toCSV command, and specifying an optional filename.

```js
mydf.toCSV("mydownload.csv")
```

## pldf functions

### arrange
The arrange function sorts the pldf by values in the specified column. Values are sorted in ascending order by default, but this can be overwritten by passing ```"desc"``` to the optional direction command.

```js
mydf.arrange("col1", "desc");
```

### bind
The bind function adds the rows of another pldf to the first pldf. Headers of the two pldfs must be identical.

```js
mydf.bind(otherpldf);
```

### filter
The filter function removes any values from the pldf that do not meet the specified criteria. The base filter function returns all rows for which the value in the specified column is equal to the specified condition.

```js
mydf.filter("col1", 3)
```

In addition, filter includes a flexible filterFn function that allows for user specified conditions. These conditions should be written as a condition that evaluates up to two values from a set of columns, and returns a Boolean.

```js
// User specified way to filter for rows with equal values
mydf.filterFn("col1", "col2", function(a,b){
    return(a === b);
});
```

Finally, filter includes two shortcut functions, which allow the user to find values that are greater or less than the specified condition.

```js
mydf.filterGt("col1", 3) // Returns values greater than 3
mydf.filterLt("col1", 3) // Returns values less than 3
```

### merge
The merge function combines two pldf by a specified column, matching the order of rows to the values of that column. By default, merge drops rows from the second DataFrame that have values in the evaluation column that are not contained in the first DataFrame's evaluation column. To override this behaviour, users can set ```keepy``` to true.

```js
mydf.merge(otherpldf, "col1", "col2", true)
```

### mutate
The mutate function adds the columns of another pldf to the first pldf. The two pldfs must have an identical number of rows. 

```js
mydf.mutate(otherpldf);
```

In addition, mutateFn can be used to add new columns to the pldf that base their values off one or more of the other columns in the DataFrame, based on a function provided by the user. This function should take two values from the specified columns, and should return a new value for the new column.

```js
// User specified way to create a column "newcol" that adds values from two existing columns
mydf.mutateFn("newcol", "col1", "col2", function(a,b){
    return(a + b);
});
```

Finally, mutate includes a number of shortcut functions, which cover a range of common use cases.

```js
mydf.mutateAv("newcol", "col1", "col2") // newcol is the average of the two columns
mydf.mutateSm("newcol", "col1", "col2") // newcol is the sum of the two columns
mydf.mutateDf("newcol", "col1", "col2") // newcol is the difference of the columns
mydf.mutateDv("newcol", "col1", "col2") // newcol is equal to col1 divided by col2
mydf.mutateTx("newcol", "My label") // newcol contains the specified text in every row
mydf.mutateRn("newcol", "col1") // newcol contains the ordered rank of values in the specified column
```

### remove
The remove function deletes columns from the pldf. The remove function expects an array of column headers, even if only one column is being deleted.

```js
mydf.remove(["col1", "col2"])
```

### rename
The rename function renames a column from the pldf. Similarly, the renameAll function renames all specified columns.

```js
mydf.rename("col1", "Value")
mydf.renameAll(["col1", "col2"], ["Value", "Text"])
```

### replace
The replace function substitutes all matching values in a column with the new specified value. Similarly, the replaceNulls function substitutes all ```null``` or ```undefined``` values with the specified value.

```js
mydf.replace("col1", 1, 0)
mydf.replaceNulls("col1", 1)
```

### select
The select function returns only the specified columns, removing all others from the pldf.

```js
mydf.select(["col1", "col2"])
```

### slice
The slice function returns only the specified rows, removing all others from the pldf.

```js
mydf.slice(1, 3)
```

### summarise
The summarise function works similarly to a Pivot table, reducing the pldf to unique values in the specified groupby array, and adding, averaging or counting the values in the specified column.

```js
mydf.summarise(["col2", "col3"], "col1", "sum")
mydf.summarise(["col2", "col3"], "col1", "mean")
mydf.summarise(["col2", "col3"], "col1", "count")
```

At present, summarise only has the three functions shown above - sum, mean, and count - however a function with a user-specified input will be added at a later stage.

## pldt functions
pldt is an interactive HTML table that updates as changes are made to the pldf object. pldt is currently in development and additional information will be added at a later date.

## Helper functions 
Additional helper functions, particularly to assist with preparing data before passing it to a pldf, will be added in future updates. 

### prep_JSONarray
The prep_JSONarray function works converts data structured as an array of JSON objects, into data that is suitably structured for a pldf. Users should specify which keys from the Objects in the array should be used as column headers in their new pldf.

```js
let rawdata = [
    {"col1":1, "col2":"One", "col3":true},
    {"col1":2, "col2":"Two", "col3":true},
    {"col1":3, "col2":"Three", "col3":false},
]

let mydata = prep_JSONarray(rawdata, ["col1", "col2", "col3"]);

let mydf = new pldf(mydata)
```
