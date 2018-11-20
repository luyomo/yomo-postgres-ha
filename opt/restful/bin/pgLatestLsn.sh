#!/bin/bash

pg_waldump $1 2>/dev/null | tail -n 1
