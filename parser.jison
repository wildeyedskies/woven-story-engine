/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\n\n                  return 'NEWLINE'
\n*"{"(\n|\s)*           return '{'
(\n|\s)*"}"\n*           return '}'
"\em"\s*                 return 'EM'
"\bf"\s*                 return 'BF'
"\section"\s?"("(\w+(","\s?)?)+")"\s*  return 'SECTION'
"\nav"\s\w+\s?("("(\w+(","\s?)?)+")")?\s* return 'NAVIGATE'
"\show"\s\w+\s?("("(\w+(","\s?)?)+")")?(\s["true"|"false"])?\s* return 'SHOW'
"\if"\s[^{\n]+                return 'IF'
"\else"\s*                    return 'ELSE'
"\h1"\s*                      return 'H1'
"\h2"\s*                      return 'H2'
([^{}\n\\]+\n?[^{}\n\\]+)+      return 'TEXT'
<<EOF>>               return 'EOF'

/lex

/* operator associations and precedence */

%left 'NEWLINE' 'HEADING1' 'HEADING2' 'TEXT'

%start expressions

%% /* language grammar */

expressions
    : file EOF
        {console.log($1); return $1;}
    ;

file
    : section
        {$$ = $1;}
    | file section
        {$$ = $1 + $2}
    ;

section
    : 'SECTION' '{' sectionContent '}'
        {
            var arguments = $1.substring($1.indexOf('(') + 1, $1.indexOf(')')).split(',').map((i) => { return i.trim() })
            var fnName = arguments[0]
            arguments.splice(0,1)
            $$ = "function " + fnName + "(" + arguments.join(", ") + ")" + "{ return `" + $3 + "`}\n";
        }
    ;

sectionContent
    : block
        {$$ = $1;}
    | sectionContent 'NEWLINE' block
        {$$ = $1 + $3;}
    ;


block
    : paragraph
        {$$ = "<p>" + $1 + "</p>";}
    | 'HEADING1'
        {$$ = "<h1>" + $1.substring(2) + "</h1>";}
    | 'HEADING2'
        {$$ = "<h2>" + $1.substring(3) + "</h2>";}
    ;

paragraph
    : text
        {$$ = $1;}
    | text paragraph
        {$$ = $1 + $2;}
    ;

text
    : 'TEXT'
        {$$ = $1.replace("\n", " ");}
    | 'EM' '{' 'TEXT' '}'
        {$$ = "<em>" + $3.replace("\n", " ") + "</em>";}
    | 'BF' '{' 'TEXT' '}'
        {$$ = "<strong>" + $3.replace("\n", " ") + "</strong>";}
    | 'NAVIGATE' '{' 'TEXT' '}'
        {
            var arguments = $1.substring($1.indexOf('(') + 1, $1.indexOf(')')).split(',').map((i) => { return i.trim() })
            var sectionName = arguments[0]
            arguments.splice(0,1)
            $$ = "<a onclick=\"navigate(" + sectionName + "(" + arguments.join(", ") + "))\">" + $3 + "</a>";
        }
    | 'SHOW' '{' 'TEXT' '}'
        {
            var arguments = $1.substring($1.indexOf('(') + 1, $1.indexOf(')')).split(',').map((i) => { return i.trim() })
            var sectionName = arguments[0]
            var preserveLinkText = arguments[1]
            arguments.splice(0,2)
            $$ = "<a onclick=\"expand(this, " + sectionName + "(" + arguments.join(", ") + "), " + preserveLinkText + ")>" + $3 + "</a>";
        }
    ;
