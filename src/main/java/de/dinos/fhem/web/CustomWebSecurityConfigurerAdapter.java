package de.dinos.fhem.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.File;
import java.io.FileReader;
import java.util.Properties;

@Configuration
@EnableWebSecurity
public class CustomWebSecurityConfigurerAdapter extends WebSecurityConfigurerAdapter {

  @Autowired
  private MyBasicAuthenticationEntryPoint authenticationEntryPoint;

  @Autowired
  public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
    Properties authProperties = new Properties();
    authProperties.load(new FileReader(new File("basic-auth.properties")));

    auth.inMemoryAuthentication()
        .withUser(authProperties.getProperty("user")).password(passwordEncoder().encode(authProperties.getProperty("password")))
        .authorities("ROLE_USER");
  }

  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
        .antMatchers("/securityNone").permitAll()
        .anyRequest().authenticated()
        .and()
        .httpBasic()
        .authenticationEntryPoint(authenticationEntryPoint);

//    http.addFilterAfter(new CustomFilter(),
//        BasicAuthenticationFilter.class);
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}