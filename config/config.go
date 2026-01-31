package config

import (
	"flag"

	"github.com/ian-kent/envconf"
)

func DefaultConfig() *Config {
	return &Config{
		AuthFile: "",
		AuthBasic: "",
	}
}

type Config struct {
	AuthFile  string
	AuthBasic string
	WebPath   string
}

var cfg = DefaultConfig()

func Configure() *Config {

	//sanitize webpath
	//add a leading slash
	if cfg.WebPath != "" && !(cfg.WebPath[0] == '/') {
		cfg.WebPath = "/" + cfg.WebPath
	}

	return cfg
}

func RegisterFlags() {
	flag.StringVar(&cfg.AuthFile, "auth-file", envconf.FromEnvP("MH_AUTH_FILE", "").(string), "A username:bcryptpw mapping file")
	flag.StringVar(&cfg.AuthBasic, "auth-basic", envconf.FromEnvP("MH_AUTHORIZATION_BASIC", "").(string), "Basic authentication credentials in username:password format")
	flag.StringVar(&cfg.WebPath, "ui-web-path", envconf.FromEnvP("MH_UI_WEB_PATH", "").(string), "WebPath under which the UI is served (without leading or trailing slashes), e.g. 'mailhog'. Value defaults to ''")
}
