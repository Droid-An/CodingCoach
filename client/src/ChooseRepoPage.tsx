import './App.css'
import { useState, useEffect, useCallback } from 'react';
import { getGithubToken } from './networks/auth0';
import { getRepoContent, getRepoFile, getUserRepos, searchRepos, RepoContent, Repo } from './networks/github';
import { useNavigate } from 'react-router-dom';
import { getStoredRepoFiles, getStoredRepoList, setStoredRepoFiles, setStoredRepoList } from './hooks/localStorage';
import NavBar from './NavBar';
import { useAuth0 } from "@auth0/auth0-react";


const ChooseRepo = () => {
  const navigate = useNavigate();

  const [repos, setRepos] = useState<Repo[]>([]);
  const [contents, setContents] = useState<RepoContent | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Repo[]>([]);

  const [chosenRepo, setChosenRepo] = useState<string>('');
  const [chosenFile, setChosenFile] = useState<string | undefined>('');

  const [reposLoading, setReposLoading] = useState<boolean>(true);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [contentsLoading, setContentsLoading] = useState<boolean>(false);
  const { user, isLoading, error, isAuthenticated } = useAuth0();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Oops... {error.message}</div>;
  }

  const loadRepos = async () => {
    if (!user) {
      return;
    }

    setReposLoading(true);

    const storedRepoList = getStoredRepoList(user.sub)
    if (storedRepoList) {
      setRepos(repos);
      setReposLoading(false);
    }

    const loadRepos = async () => {
      const token = await getGithubToken(user.sub);
      const repos = await getUserRepos(token);
      setRepos(repos);
      setStoredRepoList(user.sub, repos)
      setReposLoading(false);
    };

    loadRepos();
  }

  useEffect(() => {
    loadRepos();
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (!chosenRepo || !user) {
      return;
    }

    setContentsLoading(true);

    const storedFiles = getStoredRepoFiles(chosenRepo)
    if (storedFiles) {
      setContents(storedFiles);
      setContentsLoading(false);
    }

    const loadContents = async () => {
      const token = await getGithubToken(user.sub);
      const files = await getRepoContent(token, chosenRepo);
      setContents(files);
      setStoredRepoFiles(chosenRepo, files)
      setContentsLoading(false);
    };

    loadContents();
  }, [chosenRepo]);

  useEffect(() => {
    if (!chosenFile || !chosenRepo || !user) {
      return;
    }

    const loadFile = async () => {
      const token = await getGithubToken(user.sub);
      const fileContents = await getRepoFile(token, chosenRepo, chosenFile);
      navigate('/', {
        state: {
          fileContents
        }
      })
    }

    loadFile();
  }, [chosenFile]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery) return;

    setSearchResults([]);
    setSearchLoading(true);
    const token = await getGithubToken(user?.sub ?? '');
    const username = user?.nickname ?? '';
    const results = await searchRepos(token, searchQuery, username);
    setSearchResults(results);
    setSearchLoading(false);
  }, [searchQuery, user]);

  const renderRepoContent = (content: RepoContent) => {
    if (content.type === 'file') {
      return <li key={content.path}><button type="button" style={{ margin: '4px' }} className="btn btn-primary" onClick={() => setChosenFile(content.path)}
      >{content.name}</button></li >;
    }

    return (
      <li key={content.name}>
        {content.name}
        <ul>
          {content.children?.map((child: RepoContent) => renderRepoContent(child))}
        </ul>
      </li>
    );
  };

  const getRepoList = () => {
    return <>
      {repos.map(repo => (
        <button type="button" style={{ margin: '4px' }} className="btn btn-primary" key={repo.id} onClick={() => setChosenRepo(repo.full_name)}
        >{repo.name}</button>
      ))}
    </>
  }

  const getContents = () => {
    return <ul>
      {contents && contents.children && contents.children.map((content: any) => renderRepoContent(content))}
    </ul>
  }

  return (
    <>
      <NavBar />
      <div className="container mt-4 p-4 bg-light rounded border">
        <h1 className="mb-4">Choose a repository</h1>
        <h5>Recently used repositories: </h5>
        {reposLoading ? <div className="spinner" /> : getRepoList()}
        <br />
        <br />
        <h5>Search for a repository:</h5>

        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Repository name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <button className="btn btn-outline-secondary" type="button" onClick={handleSearch}>
            Search
          </button>
        </div>
        {searchLoading ? <div className="spinner" /> : <></>}
        {searchResults.length === 0
          ? <></>
          : searchResults.map((repo) => (
            <button
              type="button"
              style={{ margin: '4px' }}
              className="btn btn-secondary"
              key={repo.id}
              onClick={() => setChosenRepo(repo.full_name)}>
              {repo.name}
            </button>
          ))
        }
      </div>
      {chosenRepo &&
        <div className="container mt-4 p-4 bg-light rounded border">
          <h1>Choose a file</h1>
          {contentsLoading ? <div className="spinner" /> : getContents()}
        </div>
      }
    </>
  );
};

export default ChooseRepo;
