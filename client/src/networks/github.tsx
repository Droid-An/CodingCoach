import axios from 'axios';


export interface RepoContent {
    name: string;
    type: 'file' | 'dir';
    path?: string;
    sha?: string;
    size?: number;
    url?: string;
    html_url?: string;
    git_url?: string;
    download_url?: string;
    children?: RepoContent[];
    _links?: {
        self: string;
        git: string;
        html: string;
    };
}

export interface Repo {
    id: number;
    full_name: string;
    name: string;
}

export const getUserRepos = async (accessToken: string, limit: number = 10) => {
    try {
        const response = await axios.get('https://api.github.com/user/repos', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
            params: {
                visibility: 'all', // Retrieve both public and private repositories
                sort: 'pushed', // Sort repositories by the date they were last updated
                affiliation: 'owner, collaborator', // Retrieve repositories that the authenticated user owns,
                per_page: limit, // Limit the number of repositories to retrieve,
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching user repositories:', error);
        throw error;
    }
};

export const getRepoContent = async (accessToken: string, repo_full_name: string, path: string = ''): Promise<RepoContent> => {
    try {
        const response = await axios.get(`https://api.github.com/repos/${repo_full_name}/contents/${path}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        const contents = response.data;

        let result: RepoContent = {
            name: path || repo_full_name,
            type: 'dir',
            children: []
        };

        for (const item of contents) {
            if (item.type === 'file') {
                result.children!.push(item);
            } else if (item.type === 'dir') {
                const dirContent = await getRepoContent(accessToken, repo_full_name, item.path);
                result.children!.push(dirContent);
            }
        }

        // Filter out non-code files
        result.children = result.children!.filter((file: any) => {
            if (file.type === 'file') {
                const ext = file.name.split('.').pop();
                return isValidFile(ext);
            }
            return true;
        });

        return result;
    } catch (error) {
        console.error('Error fetching repository content:', error);
        throw error;
    }
};

export const getRepoFile = async (accessToken: string, repo_full_name: string, path: string): Promise<string> => {
    try {
        const response = await axios.get(`https://api.github.com/repos/${repo_full_name}/contents/${path}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        const content = response.data.content;
        return atob(content);

    } catch (error) {
        console.error('Error fetching repository content:', error);
        throw error;
    }

}

export const searchRepos = async (accessToken: string, query: string, username: string) => {
    try {
        const response = await axios.get('https://api.github.com/search/repositories', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
            params: {
                q: `${query} user:${username} in:name`,
            },
        });

        return response.data.items;
    } catch (error) {

        console.error('Error searching repositories:', error);
        throw error;
    }
};

const isValidFile = (extension: string) => {
    return [
        "4th", "a51", "adb", "ada", "adml", "admx", "adoc", "ads", "agda", "ahk", "ahkl", "aj", "als", "ampl", "ant", "apib", "apl", "applescript", "arc", "arpa", "as", "asax", "asc", "asciidoc", "ascx", "ash", "ashx", "asm", "asmx", "asp", "aspx", "asr", "awk", "axd", "b", "bat", "bb", "bb.decls", "befunge", "bison", "bmx", "boo", "brd", "bro", "builder", "c", "c++", "cake", "capnp", "cc", "ccproj", "ccxml", "cfc", "cfm", "cfml", "ch", "chpl", "chs", "cirru", "cl", "cl2", "clj", "cljc", "cljs", "cljs.hl", "cljx", "clp", "cls", "clw", "cmake", "cmake.in", "cob", "cobol", "coffee", "com", "cpp", "cpp-objdump", "cppobjdump", "cql", "creole", "cs", "csdef", "csh", "cson", "csproj", "csx", "ctp", "cu", "cuh", "cxx", "cxx-objdump", "d", "d-objdump", "dart", "dats", "db", "ddl", "depproj", "diff", "dita", "ditamap", "ditaval", "dockerfile", "dotsettings", "dpatch", "dtx", "dylan", "e", "ebuild", "ecl", "eclxml", "edn", "eex", "el", "eliom", "eliomi", "elm", "emacs", "emberscript", "erl", "es", "escript", "ex", "exs", "f", "f03", "f08", "f77", "f90", "f95", "factor", "fan", "fancypack", "fasm", "fcgi", "feature", "filters", "flux", "for", "forth", "fpp", "fr", "freemarker", "frt", "fs", "fsi", "fsproj", "fsx", "fth", "ftl", "g4", "gap", "gemspec", "glade", "gml", "gmx", "god", "gradle", "groovy", "grxml", "gsp", "gyp", "h", "h++", "haml", "handlebars", "hats", "haxe", "hbs", "hh", "hpp", "hrl", "hs", "html", "hx", "hxx", "iced", "icl", "idc", "iml", "inc", "inl", "ino", "ins", "intr", "io", "ipynb", "ivy", "j", "jade", "java", "jbuilder", "jl", "js", "jsproj", "json", "json5", "jsonc", "jsonld", "jsonnet", "jsx", "kml", "kt", "ktm", "kts", "l", "lbx", "ld", "less", "lex", "lfe", "lisp", "litcoffee", "lmi", "lock", "log", "lol", "lsl", "lua", "m", "m4", "mak", "make", "makefile", "mako", "man", "markdown", "mask", "matlab", "md", "mdpolicy", "meson", "mib", "mjml", "mk", "mkd", "mkdown", "mkfile", "mkii", "mkiv", "mkvi", "ml", "ml4", "mli", "mll", "mly", "mm", "mxml", "nasm", "nawk", "nginx", "nim", "nims", "nimble", "nix", "nl", "nproj", "ns", "nsh", "nsi", "nu", "nuspec", "ny", "objdump", "odd", "osm", "p6", "p6l", "p6m", "pas", "patch", "pb", "pbi", "pde", "perl", "php", "php3", "php4", "php5", "phps", "phpt", "phtml", "pir", "pl", "pl6", "plx", "pm", "pm6", "pod", "podsl", "pot", "pov", "pp", "prc", "properties", "proto", "ps1", "ps1xml", "psc1", "psd1", "psm1", "pt", "pug", "py", "py3", "pyde", "pyi", "pyp", "pyt", "pyw", "qml", "r", "rabl", "rake", "rb", "rbw", "rbx", "rd", "rdf", "rdoc", "resx", "rexx", "rhtml", "rkt", "rktd", "rktl", "rlib", "ronn", "rs", "rss", "rst", "rtf", "ru", "ruby", "s", "sas", "sass", "scala", "scaml", "scm", "scss", "sh", "shproj", "slim", "sls", "smali", "sml", "smt2", "sol", "soy", "sparql", "sql", "sqlite", "srt", "ss", "stan", "stex", "storyboard", "styl", "stylus", "sv", "svg", "svh", "swift", "t", "tac", "targets", "tcl", "tcsh", "tex", "textile", "tf", "thor", "thrift", "tm", "tml", "toml", "ts", "tsx", "tt", "tt2", "ttcn", "ttcn3", "twig", "txl", "txt", "uc", "urdf", "v", "vala", "vapi", "vb", "vba", "vbhtml", "vbproj", "vbs", "vcxproj", "vhdl", "vim", "vue", "wixproj", "wsdl", "wsf", "wsgi", "x3d", "xacro", "xaml", "xib", "xliff", "xml", "xml.dist", "xproj", "xsd", "xspec", "xul", "yaml", "yml", "zsh"
    ].includes(extension);

}

